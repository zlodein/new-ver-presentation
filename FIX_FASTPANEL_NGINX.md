# Исправление конфигурации Nginx в FastPanel

## Найденные файлы

- `/etc/nginx/fastpanel2-sites/e_presentati_usr/e-presentation.ru.conf` - активная конфигурация
- `/etc/nginx/fastpanel2-available/e_presentati_usr/e-presentation.ru.conf` - доступная конфигурация  
- `/etc/nginx/fastpanel2-sites/e_presentati_usr/e-presentation.ru.includes` - дополнительные директивы

## Команды для исправления

### 1. Создать резервную копию

```bash
cp /etc/nginx/fastpanel2-sites/e_presentati_usr/e-presentation.ru.conf /etc/nginx/fastpanel2-sites/e_presentati_usr/e-presentation.ru.conf.backup.$(date +%Y%m%d_%H%M%S)
```

### 2. Просмотреть текущую конфигурацию

```bash
cat /etc/nginx/fastpanel2-sites/e_presentati_usr/e-presentation.ru.conf
```

### 3. Отредактировать конфигурацию

```bash
nano /etc/nginx/fastpanel2-sites/e_presentati_usr/e-presentation.ru.conf
```

### 4. Или использовать дополнительные директивы (рекомендуется для FastPanel)

FastPanel может перезаписывать основной файл, поэтому лучше использовать файл includes:

```bash
nano /etc/nginx/fastpanel2-sites/e_presentati_usr/e-presentation.ru.includes
```

Вставьте следующее (это добавится к основной конфигурации):

```nginx
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

# SPA routing - все остальные запросы на index.html
location / {
    try_files $uri $uri/ /index.html;
}
```

### 5. Проверка и перезагрузка

```bash
# Проверка конфигурации
nginx -t

# Перезагрузка Nginx
systemctl reload nginx

# Проверка статуса
systemctl status nginx
systemctl status presentation-backend
```

## Альтернатива: Редактирование через FastPanel

1. Войдите в FastPanel
2. Сайты → e-presentation.ru → Настройки → Nginx
3. В разделе "Дополнительные директивы Nginx" вставьте конфигурацию выше
4. Сохраните

Это безопаснее, так как FastPanel не перезапишет ваши изменения.
