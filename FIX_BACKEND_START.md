# Исправление проблемы запуска backend

## Проблема

Backend не запускается с ошибкой `exit-code 1` или после перезагрузки сервера сервис в панели FastPanel показывается как остановленный.

**Почему так:** если процесс падает с кодом 1, systemd перезапускает его (Restart=always), но сервис остаётся в состоянии «failed» / «activating (auto-restart)». В панели это выглядит как «остановлен». Нужно устранить причину падения (чаще всего — отсутствие или ошибка в `.env`, недоступность БД).

## Диагностика

### 1. Проверить логи backend

```bash
journalctl -u presentation-backend -n 50 --no-pager
```

Или в реальном времени:
```bash
journalctl -u presentation-backend -f
```

### 2. Проверить .env файл

```bash
cd /var/www/e_presentati_usr/data/www/e-presentation.ru/server
ls -la .env
cat .env
```

**Важно:** Backend загружает переменные из `server/.env` по фиксированному пути (от папки, где лежит `index.js`), а не из текущей рабочей директории. Поэтому при запуске через systemd/PM2 из любой папки ключи `GIGACHAT_AUTH_KEY` и `YANDEX_GEOCODER_API_KEY` должны подхватываться, если файл `server/.env` существует и переменные в нём заданы. После изменения `.env` перезапустите сервис.

### 3. Проверить права доступа

```bash
ls -la /var/www/e_presentati_usr/data/www/e-presentation.ru/server/
chown -R e_presentati_usr:e_presentati_usr /var/www/e_presentati_usr/data/www/e-presentation.ru/server
chmod 600 /var/www/e_presentati_usr/data/www/e-presentation.ru/server/.env
```

### 4. Проверить наличие собранного backend

Должна быть папка `server/dist/` с файлом `index.js` (сборка: `cd server && npm run build`):

```bash
ls -la /var/www/e_presentati_usr/data/www/e-presentation.ru/server/dist/index.js
```

### 5. Попробовать запустить вручную (увидеть реальную ошибку)

Запустите бэкенд из папки `server` — так вы увидите текст ошибки в консоли:

```bash
cd /var/www/e_presentati_usr/data/www/e-presentation.ru/server
su - e_presentati_usr
node dist/index.js
```

Если `dist/index.js` нет, попробуйте:

```bash
node index.js
```

Если при этом появляется ошибка (например, про JWT_SECRET, базу данных или модуль) — исправьте конфиг или .env и перезапустите сервис.

## Частые проблемы и решения

### Проблема 1: .env файл не найден или неправильный формат

```bash
# Создать .env файл
nano /var/www/e_presentati_usr/data/www/e-presentation.ru/server/.env
```

Вставьте:
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://e_presentati:g&7W>0@z;fGznoDz@localhost:5432/e_presentati
JWT_SECRET=your-secret-key-minimum-32-characters-long-please-change-this
FRONTEND_URL=https://e-presentation.ru
```

**Важно**: Если пароль в DATABASE_URL вызывает проблемы, используйте переменные:

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

### Проблема 2: База данных не подключается

```bash
# Проверить подключение к базе данных
sudo -u postgres psql -d e_presentati -c "SELECT 1;"

# Проверить, что пользователь существует
sudo -u postgres psql -c "\du" | grep e_presentati
```

### Проблема 3: dist директория не существует или пуста

```bash
# Проверить
ls -la /var/www/e_presentati_usr/data/www/e-presentation.ru/server/dist/

# Если пуста, нужно выполнить деплой или собрать проект
cd /var/www/e_presentati_usr/data/www/e-presentation.ru/server
npm ci --production
# Файлы dist должны быть задеплоены через GitHub Actions
```

### Проблема 4: Неправильный путь к Node.js

```bash
# Проверить путь к node
which node
# Должно быть: /usr/bin/node или /usr/local/bin/node

# Если другой путь, обновите systemd сервис
nano /etc/systemd/system/presentation-backend.service
# Измените ExecStart на правильный путь
```

### Проблема 5: Проблемы с правами доступа

```bash
# Установить правильные права
chown -R e_presentati_usr:e_presentati_usr /var/www/e_presentati_usr/data/www/e-presentation.ru/server
chmod -R 755 /var/www/e_presentati_usr/data/www/e-presentation.ru/server
chmod 600 /var/www/e_presentati_usr/data/www/e-presentation.ru/server/.env
```

## Обновление systemd сервиса

Если нужно обновить конфигурацию сервиса:

```bash
nano /etc/systemd/system/presentation-backend.service
```

Проверьте, что конфигурация правильная (путь к проекту может отличаться на вашем сервере — замените на свой):

```ini
[Unit]
Description=Presentation Backend Service
After=network-online.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=e_presentati_usr
WorkingDirectory=/var/www/e_presentati_usr/data/www/e-presentation.ru/server
EnvironmentFile=-/var/www/e_presentati_usr/data/www/e-presentation.ru/server/.env
Environment=NODE_ENV=production
Environment=PORT=3001
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StartLimitIntervalSec=60
StartLimitBurst=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=presentation-backend

[Install]
WantedBy=multi-user.target
```

**Важно:** если путь к проекту на сервере другой (например, другой домен/сайт в FastPanel), отредактируйте `WorkingDirectory` и `EnvironmentFile` на свой каталог.

После изменений:

```bash
systemctl daemon-reload
systemctl restart presentation-backend
systemctl status presentation-backend
```

## Сервис не запускается после перезагрузки сервера

1. **Убедиться, что сервис в автозагрузке:**
   ```bash
   systemctl is-enabled presentation-backend
   # Должно быть: enabled
   sudo systemctl enable presentation-backend
   ```

2. **Проверить, что unit запускает правильный файл** (`dist/index.js` после сборки):
   ```bash
   grep ExecStart /etc/systemd/system/presentation-backend.service
   # Должно быть: ExecStart=/usr/bin/node dist/index.js
   # И в server/ должна быть папка dist/ с index.js (npm run build в server/)
   ```

3. **Проверить после перезагрузки:**
   ```bash
   journalctl -u presentation-backend -b --no-pager
   ```
   Если сервис падает при старте — см. раздел «Диагностика» выше.

4. **Проверить целевой target:**
   ```bash
   systemctl get-default
   # Обычно: multi-user.target
   ```

## Проверка работы после исправления

```bash
# Проверить статус
systemctl status presentation-backend

# Проверить порт
netstat -tulpn | grep 3001

# Проверить логи
journalctl -u presentation-backend -n 20

# Проверить работу API (404 на / — норма, бэкенд отвечает)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/
```

## Nginx: чтобы работали /api/suggest, генерация текста, метро

Запросы с фронта идут на `/api/suggest`, `/api/generate_text` и т.д. Бэкенд слушает маршруты **с префиксом** `/api` (`/api/suggest`, `/api/generate_text`). В Nginx проксируйте `/api` на бэкенд **без изменения пути**:

```nginx
location /api {
    proxy_pass http://localhost:3001;   # без слэша — путь /api/... передаётся как есть
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Если у вас было `proxy_pass http://localhost:3001/;` (со слэшем — префикс убирался), замените на `http://localhost:3001;` и выполните `nginx -t && systemctl reload nginx`.
