#!/bin/bash

# Скрипт деплоя на сервер
# Использование: ./scripts/deploy.sh [environment]
# environment: staging | production (по умолчанию: production)

set -e  # Остановка при ошибке

ENVIRONMENT=${1:-production}
SERVER_IP="85.239.47.11"
SERVER_USER="root"
DEPLOY_DIR="/var/www/presentation"
BACKEND_DIR="$DEPLOY_DIR/server"
FRONTEND_DIR="$DEPLOY_DIR/frontend"
BACKUP_DIR="$DEPLOY_DIR/backups"

echo "🚀 Начало деплоя на $ENVIRONMENT окружение..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка наличия SSH ключа или запрос пароля
info "Подключение к серверу $SERVER_USER@$SERVER_IP..."

# Создание резервной копии
info "Создание резервной копии..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $BACKUP_DIR && \
    if [ -d $DEPLOY_DIR ]; then \
        tar -czf $BACKUP_DIR/backup-\$(date +%Y%m%d-%H%M%S).tar.gz -C $DEPLOY_DIR . 2>/dev/null || true; \
    fi"

# Сборка frontend
info "Сборка frontend..."
npm run build:prod

# Сборка backend
info "Сборка backend..."
cd server
npm run deploy:build
cd ..

# Создание директорий на сервере
info "Создание директорий на сервере..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $FRONTEND_DIR $BACKEND_DIR"

# Копирование frontend файлов
info "Копирование frontend файлов..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '*.md' \
    dist/ $SERVER_USER@$SERVER_IP:$FRONTEND_DIR/

# Копирование backend файлов
info "Копирование backend файлов..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'src' \
    --exclude '*.md' \
    --exclude 'tsconfig.json' \
    server/dist/ $SERVER_USER@$SERVER_IP:$BACKEND_DIR/
rsync -avz \
    server/package.json \
    server/package-lock.json \
    server/drizzle/ \
    $SERVER_USER@$SERVER_IP:$BACKEND_DIR/

# Копирование .env файла (если существует)
if [ -f "server/.env.production" ]; then
    info "Копирование .env файла..."
    scp server/.env.production $SERVER_USER@$SERVER_IP:$BACKEND_DIR/.env
elif [ -f "server/.env" ]; then
    warn "Используется .env файл (рекомендуется создать .env.production)"
    scp server/.env $SERVER_USER@$SERVER_IP:$BACKEND_DIR/.env
else
    warn ".env файл не найден. Убедитесь, что он настроен на сервере."
fi

# Установка зависимостей и запуск на сервере
info "Установка зависимостей и запуск на сервере..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e
cd /var/www/presentation/server

# Установка зависимостей
npm ci --production

# Запуск миграций базы данных
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
    npm run deploy:migrate || echo "Миграции пропущены или уже выполнены"
fi

# Перезапуск сервиса (если используется systemd)
if systemctl is-active --quiet presentation-backend; then
    echo "Перезапуск сервиса presentation-backend..."
    systemctl restart presentation-backend
else
    echo "Сервис presentation-backend не найден. Запустите вручную или настройте systemd."
fi

# Перезапуск Nginx
if systemctl is-active --quiet nginx; then
    systemctl reload nginx
fi
ENDSSH

info "✅ Деплой завершен успешно!"
info "Frontend: $FRONTEND_DIR"
info "Backend: $BACKEND_DIR"
