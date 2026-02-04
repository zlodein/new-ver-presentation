#!/bin/bash

# Скрипт настройки сервера Ubuntu 24 + FastPanel
# Использование: ./scripts/setup-server.sh
# Запускать на сервере с правами root

set -e

echo "🔧 Настройка сервера для деплоя..."

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка прав root
if [ "$EUID" -ne 0 ]; then 
    error "Пожалуйста, запустите скрипт с правами root (sudo)"
    exit 1
fi

# Обновление системы
info "Обновление системы..."
apt update && apt upgrade -y

# Установка Node.js 20.x
info "Установка Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    info "Node.js установлен: $(node -v)"
else
    info "Node.js уже установлен: $(node -v)"
fi

# Установка npm (если не установлен)
if ! command -v npm &> /dev/null; then
    apt install -y npm
fi

# Установка PostgreSQL
info "Установка PostgreSQL..."
if ! command -v psql &> /dev/null; then
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    info "PostgreSQL установлен"
else
    info "PostgreSQL уже установлен"
fi

# Установка Nginx (если не установлен через FastPanel)
info "Проверка Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    info "Nginx установлен"
else
    info "Nginx уже установлен"
fi

# Установка PM2 для управления процессами Node.js
info "Установка PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup systemd -u root --hp /root
    info "PM2 установлен"
else
    info "PM2 уже установлен"
fi

# Создание директорий для деплоя
DEPLOY_DIR="/var/www/presentation"
info "Создание директорий: $DEPLOY_DIR"
mkdir -p $DEPLOY_DIR/{frontend,server,backups}
chown -R www-data:www-data $DEPLOY_DIR

# Создание пользователя для базы данных (если нужно)
info "Настройка PostgreSQL..."
sudo -u postgres psql << EOF
-- Создание базы данных и пользователя (измените пароль!)
CREATE DATABASE presentation_db;
CREATE USER presentation_user WITH PASSWORD 'changeme_strong_password';
GRANT ALL PRIVILEGES ON DATABASE presentation_db TO presentation_user;
\q
EOF

info "⚠️  Не забудьте изменить пароль для пользователя базы данных!"

# Создание systemd сервиса для backend
info "Создание systemd сервиса для backend..."
cat > /etc/systemd/system/presentation-backend.service << 'EOF'
[Unit]
Description=Presentation Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/presentation/server
Environment=NODE_ENV=production
Environment=PORT=3001
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=presentation-backend

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
info "Systemd сервис создан (не запущен, будет запущен после деплоя)"

# Настройка Nginx
info "Создание конфигурации Nginx..."
cat > /etc/nginx/sites-available/presentation << 'EOF'
server {
    listen 80;
    server_name _;  # Замените на ваш домен
    
    root /var/www/presentation/frontend;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API проксирование на backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Кэширование статических файлов
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Активация конфигурации Nginx
ln -sf /etc/nginx/sites-available/presentation /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
info "Конфигурация Nginx создана и активирована"

# Настройка firewall (если используется ufw)
if command -v ufw &> /dev/null; then
    info "Настройка firewall..."
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    info "Firewall настроен"
fi

info "✅ Настройка сервера завершена!"
info ""
info "Следующие шаги:"
info "1. Создайте .env файл в $DEPLOY_DIR/server/ с настройками:"
info "   DATABASE_URL=postgresql://presentation_user:your_password@localhost:5432/presentation_db"
info "   JWT_SECRET=your-secret-key-min-32-characters-long"
info "   PORT=3001"
info ""
info "2. Выполните деплой проекта"
info "3. Запустите сервис: systemctl start presentation-backend"
info "4. Проверьте статус: systemctl status presentation-backend"
