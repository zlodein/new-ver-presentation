# 🚀 Руководство по деплою проекта Presentation

## 📋 Содержание

1. [Быстрый старт](#быстрый-старт)
2. [Настройка сервера](#настройка-сервера)
3. [Локальная сборка](#локальная-сборка)
4. [Деплой на сервер](#деплой-на-сервер)
5. [Docker деплой](#docker-деплой)
6. [GitHub Actions CI/CD](#github-actions-cicd)
7. [Настройка FastPanel](#настройка-fastpanel)

## 🏃 Быстрый старт

### Первоначальная настройка сервера

```bash
# 1. Подключитесь к серверу
ssh root@85.239.47.11
# Пароль: uN9?9^Ke.6jdeM

# 2. Запустите скрипт настройки
cd /tmp
wget https://raw.githubusercontent.com/your-repo/main/scripts/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

### Первый деплой

```bash
# На локальной машине
chmod +x scripts/*.sh
./scripts/deploy.sh production
```

## 🖥️ Настройка сервера

### Автоматическая настройка

Используйте готовый скрипт `scripts/setup-server.sh`:

```bash
ssh root@85.239.47.11
./scripts/setup-server.sh
```

### Ручная настройка

См. подробные инструкции в файле `SERVER_COMMANDS.md`

**Основные компоненты:**
- ✅ Node.js 20.x
- ✅ PostgreSQL 16
- ✅ Nginx
- ✅ PM2 (опционально)

## 🔨 Локальная сборка

### Сборка всего проекта

```bash
./scripts/build.sh
```

### Сборка отдельных частей

```bash
# Frontend
npm run build:prod

# Backend
cd server
npm run deploy:build
```

## 📦 Деплой на сервер

### Использование скрипта деплоя

```bash
# Production деплой
./scripts/deploy.sh production

# Staging деплой (если настроен)
./scripts/deploy.sh staging
```

### Ручной деплой

```bash
# 1. Сборка
npm run build:prod
cd server && npm run deploy:build && cd ..

# 2. Копирование на сервер
scp -r dist/* root@85.239.47.11:/var/www/presentation/frontend/
scp -r server/dist/* root@85.239.47.11:/var/www/presentation/server/
scp server/package*.json root@85.239.47.11:/var/www/presentation/server/

# 3. На сервере
ssh root@85.239.47.11
cd /var/www/presentation/server
npm ci --production
npm run deploy:migrate
systemctl restart presentation-backend
```

## 🐳 Docker деплой

### Локальная разработка

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

### Production деплой с Docker

```bash
# 1. Создайте .env файл для docker-compose
cat > .env << EOF
POSTGRES_DB=presentation_db
POSTGRES_USER=presentation_user
POSTGRES_PASSWORD=your_strong_password
JWT_SECRET=your-secret-key-minimum-32-characters-long
EOF

# 2. Сборка и запуск
docker-compose build
docker-compose up -d

# 3. Проверка статуса
docker-compose ps
docker-compose logs -f
```

## 🔄 GitHub Actions CI/CD

### Настройка

1. **Добавьте SSH ключ в секреты GitHub:**
   - Settings → Secrets and variables → Actions
   - Добавьте `SSH_PRIVATE_KEY` с приватным ключом

2. **Генерация SSH ключа:**
   ```bash
   ssh-keygen -t rsa -b 4096 -C "deploy@github-actions"
   ssh-copy-id -i ~/.ssh/id_rsa.pub root@85.239.47.11
   # Скопируйте приватный ключ в GitHub Secrets
   cat ~/.ssh/id_rsa
   ```

3. **Автоматический деплой:**
   - Push в ветку `main` или `master` автоматически запустит деплой
   - Pull requests запускают только CI (проверка и сборка)

### Workflow файлы

- `.github/workflows/ci.yml` - проверка кода и сборка для PR
- `.github/workflows/deploy.yml` - автоматический деплой на production

## ⚙️ Настройка FastPanel

Подробные инструкции см. в файле `scripts/fastpanel-setup.md`

**Основные шаги:**
1. Создайте сайт в FastPanel
2. Настройте Node.js приложение для backend
3. Настройте статический сайт для frontend
4. Настройте PostgreSQL базу данных
5. Добавьте Nginx конфигурацию для проксирования API

## 📁 Структура проекта на сервере

```
/var/www/presentation/
├── frontend/              # Собранные файлы Vue.js приложения
│   ├── index.html
│   ├── assets/
│   └── ...
├── server/                # Backend приложение
│   ├── dist/             # Собранный TypeScript код
│   ├── drizzle/          # Миграции базы данных
│   ├── package.json
│   ├── .env              # Переменные окружения
│   └── ecosystem.config.js
└── backups/              # Резервные копии
    └── backup-*.tar.gz
```

## 🔧 Управление сервисами

### Backend сервис

```bash
# Статус
systemctl status presentation-backend

# Запуск
systemctl start presentation-backend

# Остановка
systemctl stop presentation-backend

# Перезапуск
systemctl restart presentation-backend

# Логи
journalctl -u presentation-backend -f
```

### Nginx

```bash
# Перезагрузка конфигурации
nginx -t && systemctl reload nginx

# Проверка конфигурации
nginx -t

# Логи
tail -f /var/log/nginx/error.log
```

### PostgreSQL

```bash
# Статус
systemctl status postgresql

# Подключение
psql -U presentation_user -d presentation_db

# Резервная копия
pg_dump -U presentation_user presentation_db > backup.sql
```

## 🔐 Переменные окружения

### Backend (.env в /var/www/presentation/server/)

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://presentation_user:password@localhost:5432/presentation_db
JWT_SECRET=your-secret-key-minimum-32-characters-long
```

### Frontend (опционально, для production)

Создайте `.env.production`:

```env
VITE_API_URL=https://yourdomain.com/api
```

## 🐛 Troubleshooting

### Backend не запускается

1. Проверьте логи: `journalctl -u presentation-backend -n 50`
2. Проверьте .env файл
3. Проверьте порт: `netstat -tulpn | grep 3001`
4. Проверьте права доступа

### База данных не подключается

1. Проверьте статус PostgreSQL: `systemctl status postgresql`
2. Проверьте DATABASE_URL в .env
3. Проверьте права пользователя БД

### Nginx не работает

1. Проверьте конфигурацию: `nginx -t`
2. Проверьте логи: `tail -f /var/log/nginx/error.log`
3. Убедитесь, что backend запущен

## 📚 Дополнительная документация

- `DEPLOY.md` - подробная инструкция по деплою
- `SERVER_COMMANDS.md` - команды для настройки сервера
- `scripts/fastpanel-setup.md` - настройка через FastPanel

## 🔄 Откат к предыдущей версии

```bash
# На сервере
cd /var/www/presentation/backups
ls -la

# Восстановление
tar -xzf backup-YYYYMMDD-HHMMSS.tar.gz -C /var/www/presentation/

# Перезапуск
systemctl restart presentation-backend
systemctl reload nginx
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи всех сервисов
2. Убедитесь, что все сервисы запущены
3. Проверьте конфигурационные файлы
4. Проверьте права доступа к файлам

---

**Удачного деплоя! 🚀**
