#!/bin/bash

# Скрипт локальной сборки проекта
# Использование: ./scripts/build.sh

set -e

echo "🔨 Начало сборки проекта..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js версии 18 или выше."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    warn "Рекомендуется Node.js версии 18 или выше. Текущая версия: $(node -v)"
fi

# Установка зависимостей frontend
info "Установка зависимостей frontend..."
npm ci

# Сборка frontend
info "Сборка frontend..."
npm run build:prod

# Установка зависимостей backend
info "Установка зависимостей backend..."
cd server
npm ci

# Сборка backend
info "Сборка backend..."
npm run deploy:build

# Проверка наличия .env файла
if [ ! -f ".env" ] && [ ! -f ".env.production" ]; then
    warn ".env файл не найден. Создайте его перед запуском."
fi

cd ..

info "✅ Сборка завершена успешно!"
info "Frontend собран в: dist/"
info "Backend собран в: server/dist/"
