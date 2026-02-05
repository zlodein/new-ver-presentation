# Инструкция по деплою

## Предварительные требования

- Node.js 20.x или выше
- Git
- SSH доступ к серверу
- Права root на сервере

## Быстрый старт

### 1. Настройка сервера (первый раз)

Подключитесь к серверу и выполните:

```bash
ssh root@85.239.47.11
# Пароль: uN9?9^Ke.6jdeM

# Загрузите скрипт настройки
wget https://raw.githubusercontent.com/your-repo/scripts/setup-server.sh
# Или скопируйте вручную

chmod +x setup-server.sh
./setup-server.sh
```

### 2. Настройка переменных окружения

Создайте файл `.env` на сервере:

```bash
nano /var/www/e_presentati_usr/data/www/e-presentation.ru/server/.env
```

Добавьте:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://e_presentati:g&7W>0@z;fGznoDz@localhost:5432/e_presentati
JWT_SECRET=your-secret-key-minimum-32-characters-long-please-change-this
```

### 3. Локальная сборка и деплой

#### Вариант A: Использование скрипта деплоя

```bash
# Сделайте скрипты исполняемыми
chmod +x scripts/*.sh

# Выполните деплой
./scripts/deploy.sh production
```

#### Вариант B: Ручной деплой

```bash
# Сборка frontend
npm run build:prod

# Сборка backend
cd server
npm run deploy:build
cd ..

# Копирование на сервер
scp -r dist/* root@85.239.47.11:/var/www/e_presentati_usr/data/www/e-presentation.ru/
scp -r server/dist/* root@85.239.47.11:/var/www/e_presentati_usr/data/www/e-presentation.ru/server/
scp server/package*.json root@85.239.47.11:/var/www/e_presentati_usr/data/www/e-presentation.ru/server/

# На сервере
ssh root@85.239.47.11
cd /var/www/e_presentati_usr/data/www/e-presentation.ru/server
npm ci --production
npm run deploy:migrate
systemctl restart presentation-backend
```

### 4. Запуск сервисов и автозапуск при перезагрузке

Backend и Nginx (фронт отдаётся как статика через Nginx) настроены на:

- **Постоянную работу**: при падении backend перезапускается (`Restart=always` в systemd).
- **Автозапуск после перезагрузки сервера**: при настройке через `setup-server.sh` и при каждом деплое выполняется `systemctl enable presentation-backend` и `systemctl enable nginx`.

```bash
# Запуск backend (после первого деплоя)
systemctl start presentation-backend

# Включение автозапуска при загрузке (уже делается скриптами)
systemctl enable presentation-backend
systemctl enable nginx

# Проверка статуса
systemctl status presentation-backend
systemctl status nginx

# Просмотр логов
journalctl -u presentation-backend -f
```

## Использование Docker

### Локальная разработка с Docker

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

### Деплой с Docker

```bash
# Сборка образов
docker-compose build

# Запуск
docker-compose up -d

# Проверка статуса
docker-compose ps
```

## GitHub Actions

### Настройка секретов

В настройках репозитория GitHub добавьте секреты:

1. `SSH_PRIVATE_KEY` - приватный SSH ключ для доступа к серверу
2. `SERVER_IP` - IP адрес сервера (опционально, уже указан в workflow)

### Генерация SSH ключа

```bash
# На локальной машине
ssh-keygen -t rsa -b 4096 -C "deploy@github-actions"

# Скопируйте публичный ключ на сервер
ssh-copy-id -i ~/.ssh/id_rsa.pub root@85.239.47.11

# Добавьте приватный ключ в GitHub Secrets
cat ~/.ssh/id_rsa
```

### Автоматический деплой

После настройки секретов, каждый push в ветку `main` или `master` автоматически запустит деплой.

## Структура директорий на сервере

```
/var/www/e_presentati_usr/data/www/e-presentation.ru/
├── index.html         # Frontend (Vue.js приложение)
├── assets/            # Статические файлы frontend
├── server/            # Backend приложение
│   ├── dist/         # Собранный TypeScript код
│   ├── drizzle/      # Миграции базы данных
│   ├── package.json
│   └── .env          # Переменные окружения
└── backups/          # Резервные копии
```

## Команды для управления

### Backend

```bash
# Перезапуск
systemctl restart presentation-backend

# Остановка
systemctl stop presentation-backend

# Статус
systemctl status presentation-backend

# Логи
journalctl -u presentation-backend -f
```

### База данных

```bash
# Подключение к PostgreSQL
sudo -u postgres psql -d presentation_db

# Запуск миграций
cd /var/www/e_presentati_usr/data/www/e-presentation.ru/server
npm run deploy:migrate

# Создание резервной копии
pg_dump -U presentation_user presentation_db > backup.sql
```

### Nginx

```bash
# Перезагрузка конфигурации
nginx -t && systemctl reload nginx

# Проверка конфигурации
nginx -t

# Логи
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

## Откат к предыдущей версии

```bash
# На сервере
cd /var/www/e_presentati_usr/data/www/e-presentation.ru/backups
ls -la

# Восстановление из backup
tar -xzf backup-YYYYMMDD-HHMMSS.tar.gz -C /var/www/e_presentati_usr/data/www/e-presentation.ru/

# Перезапуск сервисов
systemctl restart presentation-backend
systemctl reload nginx
```

## Мониторинг

### Проверка работы приложения

```bash
# Проверка backend
curl http://localhost:3001/health

# Проверка frontend
curl http://localhost/

# Проверка базы данных
sudo -u postgres psql -d presentation_db -c "SELECT 1;"
```

### Использование PM2 (альтернатива systemd)

```bash
# Установка PM2
npm install -g pm2

# Запуск
cd /var/www/e_presentati_usr/data/www/e-presentation.ru/server
pm2 start ecosystem.config.js

# Сохранение конфигурации
pm2 save
pm2 startup

# Мониторинг
pm2 monit
pm2 logs presentation-backend
```

## Troubleshooting

### Backend не запускается

1. Проверьте логи: `journalctl -u presentation-backend -n 50`
2. Проверьте .env файл: `cat /var/www/e_presentati_usr/data/www/e-presentation.ru/server/.env`
3. Проверьте порт: `netstat -tulpn | grep 3001`
4. Проверьте права доступа: `ls -la /var/www/e_presentati_usr/data/www/e-presentation.ru/server`

### База данных не подключается

1. Проверьте статус PostgreSQL: `systemctl status postgresql`
2. Проверьте подключение: `psql -U presentation_user -d presentation_db`
3. Проверьте DATABASE_URL в .env файле

### Nginx не проксирует запросы

1. Проверьте конфигурацию: `nginx -t`
2. Проверьте логи: `tail -f /var/log/nginx/error.log`
3. Убедитесь, что backend запущен на порту 3001

## Безопасность

1. **Измените пароли по умолчанию**:
   - Пароль базы данных
   - JWT_SECRET
   - SSH пароль (используйте ключи)

2. **Настройте firewall**:
   ```bash
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```

3. **Настройте SSL**:
   - Используйте Let's Encrypt через FastPanel
   - Или настройте вручную через certbot

4. **Регулярные обновления**:
   ```bash
   apt update && apt upgrade -y
   npm update -g
   ```

## Поддержка

При возникновении проблем проверьте:
- Логи сервисов
- Конфигурационные файлы
- Права доступа к файлам
- Статус всех сервисов
