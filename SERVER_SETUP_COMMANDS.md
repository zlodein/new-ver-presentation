# Команды для первоначальной настройки сервера e-presentation.ru

## 1. Подключение к серверу

```bash
ssh root@85.239.47.11
# Пароль: uN9?9^Ke.6jdeM
```

## 2. Обновление системы

```bash
apt update && apt upgrade -y
```

## 3. Установка Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v  # Должно показать v20.x.x
npm -v
```

## 4. Установка PostgreSQL (если еще не установлен)

```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
systemctl status postgresql
```

## 5. Проверка базы данных (уже настроена в FastPanel)

```bash
# Проверка подключения к базе данных
sudo -u postgres psql -c "\l" | grep e_presentati

# Подключение к базе данных
sudo -u postgres psql -d e_presentati

# В консоли PostgreSQL проверьте таблицы:
\dt

# Выйти:
\q
```

## 6. Установка Nginx (если еще не установлен)

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
systemctl status nginx
```

## 7. Создание директорий для проекта

```bash
# Создание структуры директорий
DEPLOY_DIR="/var/www/e_presentati_usr/data/www/e-presentation.ru"
SITE_USER="e_presentati_usr"

mkdir -p $DEPLOY_DIR/server
mkdir -p $DEPLOY_DIR/backups

# Установка прав
chown -R $SITE_USER:$SITE_USER $DEPLOY_DIR
chmod -R 755 $DEPLOY_DIR
chmod -R 700 $DEPLOY_DIR/server
```

## 8. Создание .env файла для backend

```bash
nano /var/www/e_presentati_usr/data/www/e-presentation.ru/server/.env
```

Вставьте следующее содержимое:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://e_presentati:g&7W>0@z;fGznoDz@localhost:5432/e_presentati
JWT_SECRET=your-secret-key-minimum-32-characters-long-please-change-this-to-random-string
FRONTEND_URL=https://e-presentation.ru
```

**Важно**: 
- Замените `your-secret-key-minimum-32-characters-long-please-change-this-to-random-string` на случайную строку минимум 32 символа
- Если DATABASE_URL не работает из-за спецсимволов в пароле, используйте переменные:

```env
NODE_ENV=production
PORT=3001
DB_USER=e_presentati
DB_PASSWORD=g&7W>0@z;fGznoDz
DB_NAME=e_presentati
DB_HOST=localhost
DB_PORT=5432
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
```

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

## 9. Настройка прав на .env файл

```bash
chmod 600 /var/www/e_presentati_usr/data/www/e-presentation.ru/server/.env
chown e_presentati_usr:e_presentati_usr /var/www/e_presentati_usr/data/www/e-presentation.ru/server/.env
```

## 10. Создание systemd сервиса для backend

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
User=e_presentati_usr
WorkingDirectory=/var/www/e_presentati_usr/data/www/e-presentation.ru/server
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

Сохраните и активируйте:

```bash
systemctl daemon-reload
systemctl enable presentation-backend
# Пока не запускаем - запустим после деплоя
```

## 11. Настройка Nginx (если не настроен через FastPanel)

```bash
nano /etc/nginx/sites-available/e-presentation
```

Вставьте:

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

Активация:

```bash
ln -sf /etc/nginx/sites-available/e-presentation /etc/nginx/sites-enabled/
nginx -t  # Проверка конфигурации
systemctl reload nginx
```

## 12. Настройка firewall (если используется ufw)

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
ufw status
```

## 13. Проверка всех сервисов

```bash
# Проверка Node.js
node -v
npm -v

# Проверка PostgreSQL
systemctl status postgresql
sudo -u postgres psql -d e_presentati -c "SELECT version();"

# Проверка Nginx
systemctl status nginx
nginx -t

# Проверка портов
netstat -tulpn | grep -E '3001|80|443|5432'
```

## 14. После деплоя - запуск backend сервиса

```bash
# После того как файлы будут задеплоены через GitHub Actions или вручную:

# Установка зависимостей backend
cd /var/www/e_presentati_usr/data/www/e-presentation.ru/server
npm ci --production

# Запуск миграций базы данных
npm run deploy:migrate

# Запуск сервиса
systemctl start presentation-backend
systemctl status presentation-backend

# Просмотр логов
journalctl -u presentation-backend -f
```

## 15. Полезные команды для управления

```bash
# Перезапуск backend
systemctl restart presentation-backend

# Остановка backend
systemctl stop presentation-backend

# Просмотр логов backend
journalctl -u presentation-backend -n 50
journalctl -u presentation-backend -f

# Перезагрузка Nginx
systemctl reload nginx

# Проверка работы backend
curl http://localhost:3001/health

# Проверка работы frontend
curl http://localhost/

# Проверка подключения к базе данных
sudo -u postgres psql -d e_presentati -c "SELECT 1;"
```

## 16. Резервное копирование базы данных

```bash
# Создание backup
pg_dump -U e_presentati -d e_presentati > /var/www/e_presentati_usr/data/www/e-presentation.ru/backups/db_backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из backup
# psql -U e_presentati -d e_presentati < /var/www/e_presentati_usr/data/www/e-presentation.ru/backups/db_backup_YYYYMMDD_HHMMSS.sql
```

## 17. Настройка SSL (Let's Encrypt) - опционально

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d e-presentation.ru -d www.e-presentation.ru
certbot renew --dry-run
```

## Быстрая проверка после настройки

```bash
# Все команды для проверки одной строкой:
echo "=== Node.js ===" && node -v && npm -v && \
echo "=== PostgreSQL ===" && systemctl is-active postgresql && \
echo "=== Nginx ===" && systemctl is-active nginx && nginx -t && \
echo "=== Директории ===" && ls -la /var/www/e_presentati_usr/data/www/e-presentation.ru/ && \
echo "=== Порты ===" && netstat -tulpn | grep -E '3001|80|443|5432'
```

---

**Готово!** После выполнения этих команд сервер будет готов к деплою.
