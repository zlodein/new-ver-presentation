# Исправление ошибки 502 и настройка Nginx

## Проблема 1: Директория sites-available не существует

FastPanel использует другую структуру конфигурации Nginx. Нужно найти правильный путь.

## Проблема 2: Ошибка 502 после перезагрузки

502 означает, что Nginx не может подключиться к backend (порт 3001). Backend не запустился автоматически.

## Решение

### Шаг 1: Найти конфигурацию Nginx

```bash
ssh root@85.239.47.11
# Пароль: uN9?9^Ke.6jdeM

# Найти конфигурацию
find /etc/nginx -name "*e-presentation*" -o -name "*e_presentati*" 2>/dev/null
grep -r "e-presentation.ru" /etc/nginx/ 2>/dev/null

# Или посмотреть все конфигурации
ls -la /etc/nginx/
ls -la /etc/nginx/conf.d/
ls -la /etc/nginx/vhosts/ 2>/dev/null
```

Обычно в FastPanel конфигурация находится в:
- `/etc/nginx/vhosts/e-presentation.ru.conf`
- `/etc/nginx/conf.d/e-presentation.ru.conf`
- Или через FastPanel в веб-интерфейсе

### Шаг 2: Проверить статус backend

```bash
# Проверить статус сервиса
systemctl status presentation-backend

# Если не запущен, запустить
systemctl start presentation-backend

# Проверить, что он запускается автоматически
systemctl is-enabled presentation-backend

# Если не включен автозапуск:
systemctl enable presentation-backend
```

### Шаг 3: Проверить, что backend слушает порт 3001

```bash
# Проверить порт
netstat -tulpn | grep 3001
# Или
ss -tulpn | grep 3001

# Проверить логи backend
journalctl -u presentation-backend -n 50
journalctl -u presentation-backend -f
```

### Шаг 4: Исправить конфигурацию Nginx

Если конфигурация найдена (например, `/etc/nginx/vhosts/e-presentation.ru.conf`):

```bash
# Создать резервную копию
cp /etc/nginx/vhosts/e-presentation.ru.conf /etc/nginx/vhosts/e-presentation.ru.conf.backup

# Открыть для редактирования
nano /etc/nginx/vhosts/e-presentation.ru.conf
```

Или если конфигурация в другом месте, найдите её и отредактируйте.

### Шаг 5: Правильная конфигурация Nginx

Вставьте следующую конфигурацию (замените содержимое файла):

```nginx
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
```

**Важно**: Используйте `127.0.0.1:3001` вместо `localhost:3001` для надежности.

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

### Шаг 6: Проверка и перезагрузка Nginx

```bash
# Проверка конфигурации
nginx -t

# Если ошибок нет, перезагрузите
systemctl reload nginx

# Или перезапустите
systemctl restart nginx
```

### Шаг 7: Проверка работы

```bash
# Проверить статус всех сервисов
systemctl status nginx
systemctl status presentation-backend
systemctl status postgresql

# Проверить порты
netstat -tulpn | grep -E '3001|80|443'

# Проверить логи
tail -f /var/log/nginx/error.log
journalctl -u presentation-backend -f
```

## Альтернатива: Настройка через FastPanel

Если не можете найти конфигурационный файл:

1. Войдите в FastPanel
2. Перейдите в **Сайты** → **e-presentation.ru**
3. Откройте **Настройки** → **Nginx**
4. Добавьте или замените конфигурацию на ту, что выше
5. Сохраните

## Если backend не запускается

### Проверка .env файла

```bash
cd /var/www/e_presentati_usr/data/www/e-presentation.ru/server
cat .env

# Проверьте, что файл существует и содержит правильные данные
```

### Проверка прав доступа

```bash
# Проверка прав на файлы
ls -la /var/www/e_presentati_usr/data/www/e-presentation.ru/server/

# Установка правильных прав
chown -R e_presentati_usr:e_presentati_usr /var/www/e_presentati_usr/data/www/e-presentation.ru/server
chmod 600 /var/www/e_presentati_usr/data/www/e-presentation.ru/server/.env
```

### Ручной запуск backend для проверки

```bash
cd /var/www/e_presentati_usr/data/www/e-presentation.ru/server
su - e_presentati_usr
export $(cat .env | grep -v '^#' | xargs)
node dist/index.js
```

Если запускается вручную, но не через systemd - проблема в конфигурации сервиса.

### Проверка systemd сервиса

```bash
# Просмотр конфигурации сервиса
cat /etc/systemd/system/presentation-backend.service

# Проверка логов
journalctl -u presentation-backend -n 100 --no-pager
```

## Быстрая диагностика

Выполните все команды одной строкой:

```bash
echo "=== Nginx ===" && systemctl status nginx --no-pager -l && \
echo "=== Backend ===" && systemctl status presentation-backend --no-pager -l && \
echo "=== PostgreSQL ===" && systemctl status postgresql --no-pager -l && \
echo "=== Порты ===" && netstat -tulpn | grep -E '3001|80|443' && \
echo "=== Конфигурация Nginx ===" && nginx -t
```
