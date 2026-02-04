# Команды для настройки сервера

## Подключение к серверу

```bash
ssh root@85.239.47.11
# Пароль: uN9?9^Ke.6jdeM
```

## Установка Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v  # Проверка версии
npm -v
```

## Установка PostgreSQL

```bash
# Установка
apt update
apt install -y postgresql postgresql-contrib

# Запуск и автозапуск
systemctl start postgresql
systemctl enable postgresql

# Проверка статуса
systemctl status postgresql
```

## Настройка PostgreSQL базы данных

```bash
# Переключение на пользователя postgres
sudo -u postgres psql

# В консоли PostgreSQL выполните:
CREATE DATABASE presentation_db;
CREATE USER presentation_user WITH PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE presentation_db TO presentation_user;
\q

# Проверка подключения
psql -U presentation_user -d presentation_db -h localhost
```

## Установка Nginx

```bash
# Установка
apt install -y nginx

# Запуск и автозапуск
systemctl start nginx
systemctl enable nginx

# Проверка статуса
systemctl status nginx

# Проверка конфигурации
nginx -t
```

## Настройка Nginx для проекта

```bash
# Создание конфигурации
nano /etc/nginx/sites-available/presentation
```

Вставьте следующую конфигурацию:

```nginx
server {
    listen 80;
    server_name your_domain.com;  # Замените на ваш домен или IP
    
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
```

Активация конфигурации:

```bash
# Создание символической ссылки
ln -sf /etc/nginx/sites-available/presentation /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации (опционально)
rm /etc/nginx/sites-enabled/default

# Проверка и перезагрузка
nginx -t
systemctl reload nginx
```

## Установка PM2 (опционально, альтернатива systemd)

```bash
npm install -g pm2

# Запуск приложения
cd /var/www/presentation/server
pm2 start ecosystem.config.js

# Сохранение конфигурации для автозапуска
pm2 save
pm2 startup

# Полезные команды PM2
pm2 list
pm2 logs presentation-backend
pm2 restart presentation-backend
pm2 stop presentation-backend
pm2 monit
```

## Создание systemd сервиса для backend

```bash
nano /etc/systemd/system/presentation-backend.service
```

Вставьте:

```ini
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
```

Активация сервиса:

```bash
# Перезагрузка systemd
systemctl daemon-reload

# Включение автозапуска
systemctl enable presentation-backend

# Запуск (после деплоя)
systemctl start presentation-backend

# Проверка статуса
systemctl status presentation-backend

# Просмотр логов
journalctl -u presentation-backend -f
```

## Настройка firewall (UFW)

```bash
# Установка UFW (если не установлен)
apt install -y ufw

# Разрешение портов
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Включение firewall
ufw --force enable

# Проверка статуса
ufw status
```

## Настройка SSL с Let's Encrypt

```bash
# Установка certbot
apt install -y certbot python3-certbot-nginx

# Получение сертификата
certbot --nginx -d your_domain.com

# Автоматическое обновление
certbot renew --dry-run
```

## Создание директорий проекта

```bash
# Создание структуры директорий
mkdir -p /var/www/presentation/{frontend,server,backups}

# Установка прав
chown -R www-data:www-data /var/www/presentation
chmod -R 755 /var/www/presentation
```

## Создание .env файла

```bash
cd /var/www/presentation/server
nano .env
```

Добавьте:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://presentation_user:your_password@localhost:5432/presentation_db
JWT_SECRET=your-secret-key-minimum-32-characters-long-please-change-this
```

## Запуск миграций базы данных

```bash
cd /var/www/presentation/server
npm install
npm run deploy:migrate
```

## Полезные команды для мониторинга

```bash
# Проверка работы backend
curl http://localhost:3001/health

# Проверка работы frontend
curl http://localhost/

# Проверка портов
netstat -tulpn | grep -E '3001|80|5432'

# Использование ресурсов
htop
df -h
free -h

# Логи Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Логи PostgreSQL
tail -f /var/log/postgresql/postgresql-*.log
```

## Резервное копирование базы данных

```bash
# Создание backup
pg_dump -U presentation_user presentation_db > /var/www/presentation/backups/db_backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из backup
psql -U presentation_user presentation_db < /var/www/presentation/backups/db_backup_YYYYMMDD_HHMMSS.sql
```

## Настройка через FastPanel

Если используется FastPanel, см. файл `scripts/fastpanel-setup.md` для подробных инструкций.

## Обновление системы

```bash
# Обновление списка пакетов
apt update

# Обновление установленных пакетов
apt upgrade -y

# Очистка неиспользуемых пакетов
apt autoremove -y
apt autoclean
```

## Проверка всех сервисов

```bash
# Статус всех сервисов
systemctl status nginx
systemctl status postgresql
systemctl status presentation-backend

# Проверка портов
ss -tulpn | grep -E '3001|80|443|5432'
```
