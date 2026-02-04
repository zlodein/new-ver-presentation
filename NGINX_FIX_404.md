# Исправление ошибки 404 для SPA (Single Page Application)

## Проблема

При переходе на разные страницы или обновлении страницы появляется ошибка 404. Это происходит потому, что Nginx пытается найти физический файл по пути, но его нет - все маршруты обрабатываются на клиенте через Vue Router.

## Решение

Нужно обновить конфигурацию Nginx, чтобы все запросы (кроме статических файлов и API) перенаправлялись на `index.html`.

## Команды для исправления на сервере

### Вариант 1: Если используется FastPanel

1. Войдите в FastPanel
2. Перейдите в **Сайты** → **e-presentation.ru** → **Настройки** → **Nginx**
3. Замените конфигурацию на следующую:

```nginx
# Проксирование API запросов на backend
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

# Статические файлы (должны быть ДО location /)
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot|map)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
}

# SPA routing - ВСЕ остальные запросы на index.html
location / {
    try_files $uri $uri/ /index.html;
}
```

4. Сохраните и перезагрузите Nginx

### Вариант 2: Если настраиваете вручную через SSH

```bash
ssh root@85.239.47.11
# Пароль: uN9?9^Ke.6jdeM

# Откройте конфигурацию Nginx
nano /etc/nginx/sites-available/e-presentation
# Или если конфигурация в другом месте:
# nano /etc/nginx/conf.d/e-presentation.conf
# Или через FastPanel путь может быть:
# nano /etc/nginx/vhosts/e-presentation.ru.conf
```

Вставьте полную конфигурацию:

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
```

**Ключевые моменты:**
1. `location /api` должен быть **ДО** `location /`
2. `location ~* \.(...)$` для статических файлов должен быть **ДО** `location /`
3. `location /` с `try_files $uri $uri/ /index.html;` должен быть **ПОСЛЕДНИМ**

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

Проверьте и перезагрузите:

```bash
# Проверка конфигурации
nginx -t

# Если ошибок нет, перезагрузите
systemctl reload nginx

# Или перезапустите
systemctl restart nginx
```

## Проверка работы

После применения конфигурации:

1. Откройте сайт: `https://e-presentation.ru`
2. Перейдите на любую страницу (например, `/presentations`)
3. Обновите страницу (F5) - не должно быть 404
4. Попробуйте открыть страницу напрямую в новой вкладке

## Если проблема осталась

### 1. Проверьте текущую конфигурацию

```bash
# Найти конфигурацию сайта
grep -r "e-presentation.ru" /etc/nginx/

# Просмотреть активную конфигурацию
nginx -T | grep -A 50 "e-presentation.ru"
```

### 2. Проверьте логи Nginx

```bash
# Логи ошибок
tail -f /var/log/nginx/error.log

# Логи доступа
tail -f /var/log/nginx/access.log
```

### 3. Проверьте порядок location блоков

Порядок важен! Должно быть так:
1. Сначала специфичные location (например, `/api`, статические файлы)
2. Потом общий `location /`

### 4. Если используется FastPanel

FastPanel может перезаписывать конфигурацию. Убедитесь, что:
- Конфигурация добавлена в раздел "Дополнительные директивы Nginx"
- Или в разделе "Настройки сайта" → "Nginx"

### 5. Альтернативная конфигурация (если выше не работает)

```nginx
# Более строгая конфигурация
location / {
    # Сначала пытаемся найти файл или директорию
    try_files $uri $uri/ @fallback;
}

# Fallback для всех остальных запросов
location @fallback {
    rewrite ^.*$ /index.html last;
}
```

## Дополнительные настройки для production

Если у вас есть SSL сертификат:

```nginx
server {
    listen 443 ssl http2;
    server_name e-presentation.ru www.e-presentation.ru;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # ... остальная конфигурация такая же
}

# Редирект с HTTP на HTTPS
server {
    listen 80;
    server_name e-presentation.ru www.e-presentation.ru;
    return 301 https://$server_name$request_uri;
}
```
