#!/bin/bash

# Быстрое исправление ошибки 502
# Использование: выполните команды по порядку на сервере

set -e

echo "🔧 Исправление ошибки 502..."

# 1. Найти конфигурацию Nginx
echo "1. Поиск конфигурации Nginx..."
CONFIG_FILE=$(find /etc/nginx -name "*e-presentation*" -o -name "*e_presentati*" 2>/dev/null | head -1)

if [ -z "$CONFIG_FILE" ]; then
    CONFIG_FILE=$(grep -r "e-presentation.ru" /etc/nginx/ 2>/dev/null | head -1 | cut -d: -f1)
fi

if [ -z "$CONFIG_FILE" ]; then
    echo "❌ Конфигурация не найдена автоматически"
    echo "Попробуйте найти вручную:"
    echo "  find /etc/nginx -name '*e-presentation*'"
    echo "  grep -r 'e-presentation.ru' /etc/nginx/"
    exit 1
fi

echo "✅ Найден файл: $CONFIG_FILE"

# 2. Проверить статус backend
echo "2. Проверка статуса backend..."
if ! systemctl is-active --quiet presentation-backend; then
    echo "⚠️  Backend не запущен, запускаю..."
    systemctl start presentation-backend
    sleep 2
fi

# Включить автозапуск
systemctl enable presentation-backend

# 3. Проверить порт
echo "3. Проверка порта 3001..."
if ! netstat -tulpn | grep -q ":3001"; then
    echo "❌ Backend не слушает порт 3001"
    echo "Проверьте логи: journalctl -u presentation-backend -n 50"
    exit 1
fi

echo "✅ Backend работает на порту 3001"

# 4. Создать резервную копию конфигурации
echo "4. Создание резервной копии..."
BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo "✅ Резервная копия: $BACKUP_FILE"

# 5. Обновить конфигурацию Nginx
echo "5. Обновление конфигурации Nginx..."
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

    # API проксирование на backend
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Статические файлы
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot|map)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA routing
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

# 6. Проверка конфигурации
echo "6. Проверка конфигурации Nginx..."
if nginx -t; then
    echo "✅ Конфигурация корректна"
    
    # 7. Перезагрузка Nginx
    echo "7. Перезагрузка Nginx..."
    systemctl reload nginx
    echo "✅ Nginx перезагружен"
    
    echo ""
    echo "✅ Готово! Проверьте сайт."
    echo ""
    echo "Статус сервисов:"
    systemctl status nginx --no-pager -l | head -3
    systemctl status presentation-backend --no-pager -l | head -3
else
    echo "❌ Ошибка в конфигурации!"
    echo "Восстанавливаю из резервной копии..."
    cp "$BACKUP_FILE" "$CONFIG_FILE"
    echo "Восстановлено из: $BACKUP_FILE"
    exit 1
fi
