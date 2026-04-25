#!/bin/bash

# Скрипт деплоя на сервер
# Использование: ./scripts/deploy.sh [environment]
# environment: staging | production (по умолчанию: production)

set -e  # Остановка при ошибке

ENVIRONMENT=${1:-production}
SERVER_IP="85.239.47.11"
SERVER_USER="root"
DEPLOY_DIR="/var/www/e_presentati_usr/data/www/e-presentation.ru"
BACKEND_DIR="$DEPLOY_DIR/server"
FRONTEND_DIR="$DEPLOY_DIR"
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

# Копирование frontend файлов (в корень сайта)
info "Копирование frontend файлов..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '*.md' \
    dist/ $SERVER_USER@$SERVER_IP:$FRONTEND_DIR/

# Nginx: FastPanel2 подключает `e-presentation.ru.includes`, а не sites-enabled — см. deploy/nginx-fastpanel-*.includes
info "Обновление Nginx (SPA fallback + /api)..."
scp deploy/nginx-fastpanel-e-presentation.ru.includes "$SERVER_USER@$SERVER_IP:/tmp/nginx-fastpanel-e-presentation.ru.includes"
scp deploy/nginx-standalone-e-presentation.conf "$SERVER_USER@$SERVER_IP:/tmp/nginx-standalone-e-presentation.conf"
scp scripts/apply-nginx-spa-on-server.sh "$SERVER_USER@$SERVER_IP:/tmp/apply-nginx-spa-on-server.sh"
ssh $SERVER_USER@$SERVER_IP "chmod +x /tmp/apply-nginx-spa-on-server.sh && /tmp/apply-nginx-spa-on-server.sh && rm -f /tmp/apply-nginx-spa-on-server.sh"

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
BACKEND_DIR_REMOTE="/var/www/e_presentati_usr/data/www/e-presentation.ru/server"
ssh $SERVER_USER@$SERVER_IP "set -e; cd $BACKEND_DIR_REMOTE;

# Установка зависимостей
npm ci --production

# Запуск миграций базы данных
if [ -f .env ]; then
    export \$(grep -v '^#' .env | xargs)
    npm run deploy:migrate || echo 'Миграции пропущены или уже выполнены'
fi

# Включение автозапуска при загрузке сервера
systemctl enable presentation-backend
systemctl enable nginx

# Запуск или перезапуск backend
systemctl restart presentation-backend

# Перезагрузка Nginx (frontend)
systemctl reload nginx
"

info "✅ Деплой завершен успешно!"
info "Frontend: $FRONTEND_DIR"
info "Backend: $BACKEND_DIR"
