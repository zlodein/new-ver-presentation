#!/bin/bash
# Скрипт для проверки и исправления проблем с компиляцией и запуском

cd /var/www/e_presentati_usr/data/www/e-presentation.ru/server

echo "=== 1. Проверка установки TypeScript ==="
if [ -f node_modules/.bin/tsc ]; then
    echo "✓ TypeScript найден в node_modules"
    echo "Используем: npx tsc"
    npx tsc
else
    echo "✗ TypeScript не найден, устанавливаем..."
    npm install typescript --save-dev
    npx tsc
fi

echo ""
echo "=== 2. Проверка результата компиляции ==="
if [ -f dist/index.js ]; then
    echo "✓ dist/index.js создан"
    ls -lh dist/index.js
else
    echo "✗ dist/index.js не найден!"
    exit 1
fi

echo ""
echo "=== 3. Проверка статуса сервиса ==="
systemctl status presentation-backend --no-pager -l

echo ""
echo "=== 4. Последние логи сервиса ==="
journalctl -u presentation-backend -n 30 --no-pager

echo ""
echo "=== 5. Проверка подключения к порту 3001 ==="
curl -s http://localhost:3001/api/auth/me 2>&1 | head -5 || echo "Не удалось подключиться"
