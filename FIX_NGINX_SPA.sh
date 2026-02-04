#!/bin/bash

# Скрипт для исправления конфигурации Nginx для SPA
# Использование: ./FIX_NGINX_SPA.sh

set -e

echo "🔧 Исправление конфигурации Nginx для SPA..."

# Найти конфигурационный файл
CONFIG_FILE=""

# Возможные пути конфигурации
POSSIBLE_PATHS=(
    "/etc/nginx/sites-available/e-presentation"
    "/etc/nginx/vhosts/e-presentation.ru.conf"
    "/etc/nginx/conf.d/e-presentation.conf"
    "/etc/nginx/sites-enabled/e-presentation"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -f "$path" ]; then
        CONFIG_FILE="$path"
        echo "Найден конфигурационный файл: $CONFIG_FILE"
        break
    fi
done

if [ -z "$CONFIG_FILE" ]; then
    echo "❌ Конфигурационный файл не найден!"
    echo "Попробуйте найти вручную:"
    echo "  grep -r 'e-presentation.ru' /etc/nginx/"
    exit 1
fi

# Создание резервной копии
BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo "✅ Создана резервная копия: $BACKUP_FILE"

# Создание правильной конфигурации
cat > "$CONFIG_FILE" << 'NGINX_CONFIG'
server {
    listen 80;
    server_name e-presentation.ru www.e-presentation.ru;
    
    root /var/www/e_presentati_usr/data/www/e-presentation.ru;
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

    # API проксирование на backend (ВАЖНО: ДО location /)
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

    # Статические файлы (ВАЖНО: ДО location /)
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot|map)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA routing - все остальные запросы на index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Отключение логирования для favicon
    location = /favicon.ico {
        log_not_found off;
        access_log off;
    }

    # Отключение логирования для robots.txt
    location = /robots.txt {
        log_not_found off;
        access_log off;
    }
}
NGINX_CONFIG

echo "✅ Конфигурация обновлена"

# Проверка конфигурации
echo "🔍 Проверка конфигурации..."
if nginx -t; then
    echo "✅ Конфигурация корректна"
    
    # Перезагрузка Nginx
    echo "🔄 Перезагрузка Nginx..."
    systemctl reload nginx
    echo "✅ Nginx перезагружен"
    
    echo ""
    echo "✅ Готово! Конфигурация применена."
    echo "Проверьте сайт - ошибка 404 должна исчезнуть."
else
    echo "❌ Ошибка в конфигурации!"
    echo "Восстанавливаю из резервной копии..."
    cp "$BACKUP_FILE" "$CONFIG_FILE"
    echo "Восстановлено из: $BACKUP_FILE"
    exit 1
fi
