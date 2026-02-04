# Настройка FastPanel для проекта Presentation

## Шаги настройки в FastPanel

### 1. Создание сайта

1. Войдите в FastPanel
2. Перейдите в раздел "Сайты" → "Создать сайт"
3. Укажите домен (или используйте IP)
4. Выберите тип: "Статический сайт" или "Node.js"
5. Создайте сайт

### 2. Настройка Node.js приложения (Backend)

1. В разделе сайта найдите "Node.js"
2. Укажите:
   - **Рабочая директория**: `/var/www/presentation/server`
   - **Файл запуска**: `dist/index.js`
   - **Порт**: `3001`
   - **Команда запуска**: `node dist/index.js`
   - **Переменные окружения**: Добавьте из `.env` файла

3. Или используйте PM2:
   - Установите PM2 через FastPanel или вручную
   - Создайте ecosystem.config.js в `/var/www/presentation/server/`

### 3. Настройка статического сайта (Frontend)

1. В настройках сайта укажите:
   - **Корневая директория**: `/var/www/presentation/frontend`
   - **Индексный файл**: `index.html`

### 4. Настройка Nginx через FastPanel

1. Перейдите в "Настройки сайта" → "Nginx"
2. Добавьте следующую конфигурацию:

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

# SPA routing
location / {
    try_files $uri $uri/ /index.html;
}
```

### 5. Настройка базы данных PostgreSQL

1. В FastPanel перейдите в "Базы данных" → "PostgreSQL"
2. Создайте новую базу данных:
   - **Имя базы**: `presentation_db`
   - **Пользователь**: `presentation_user`
   - **Пароль**: (сгенерируйте надежный пароль)

3. Обновите `.env` файл с этими данными:
   ```
   DATABASE_URL=postgresql://presentation_user:password@localhost:5432/presentation_db
   ```

### 6. Настройка SSL сертификата (опционально)

1. В FastPanel перейдите в "SSL"
2. Выберите "Let's Encrypt"
3. Укажите домен и получите сертификат

### 7. Настройка автозапуска

1. Создайте systemd сервис (см. `setup-server.sh`)
2. Или используйте PM2 через FastPanel:
   ```bash
   pm2 start /var/www/presentation/server/dist/index.js --name presentation-backend
   pm2 save
   pm2 startup
   ```

### 8. Переменные окружения

Создайте файл `/var/www/presentation/server/.env`:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://presentation_user:password@localhost:5432/presentation_db
JWT_SECRET=your-secret-key-minimum-32-characters-long-please-change-this
```

### 9. Запуск миграций

После деплоя выполните миграции:

```bash
cd /var/www/presentation/server
npm run deploy:migrate
```

### 10. Проверка работы

1. Проверьте backend: `curl http://localhost:3001/api/health` (если есть endpoint)
2. Проверьте frontend: откройте домен в браузере
3. Проверьте логи:
   - Backend: `journalctl -u presentation-backend -f`
   - Nginx: `/var/log/nginx/error.log`

## Полезные команды

```bash
# Перезапуск backend
systemctl restart presentation-backend

# Просмотр логов backend
journalctl -u presentation-backend -f

# Перезапуск Nginx
systemctl restart nginx

# Проверка статуса PostgreSQL
systemctl status postgresql

# Подключение к базе данных
sudo -u postgres psql -d presentation_db
```
