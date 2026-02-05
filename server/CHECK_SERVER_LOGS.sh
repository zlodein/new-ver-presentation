#!/bin/bash
# Скрипт для проверки логов и статуса backend сервера

echo "=== 1. Проверка процессов Node.js ==="
ps aux | grep -E "node|tsx|fastify" | grep -v grep

echo ""
echo "=== 2. Проверка портов (обычно 3000, 5000, 8080) ==="
netstat -tulpn 2>/dev/null | grep -E "3000|5000|8080|:80|:443" || ss -tulpn 2>/dev/null | grep -E "3000|5000|8080|:80|:443"

echo ""
echo "=== 3. Проверка PM2 процессов ==="
if command -v pm2 &> /dev/null; then
    pm2 list
    echo ""
    echo "=== Последние логи PM2 (50 строк) ==="
    pm2 logs --lines 50 --nostream
else
    echo "PM2 не установлен"
fi

echo ""
echo "=== 4. Проверка systemd сервисов ==="
systemctl list-units --type=service --state=running | grep -E "node|presentation|backend|api" || echo "Не найдено systemd сервисов"

echo ""
echo "=== 5. Проверка логов systemd (если есть сервис) ==="
SERVICE_NAME=$(systemctl list-units --type=service --all | grep -E "presentation|backend|api|node" | head -1 | awk '{print $1}')
if [ ! -z "$SERVICE_NAME" ]; then
    echo "Найден сервис: $SERVICE_NAME"
    echo "=== Статус ==="
    systemctl status "$SERVICE_NAME" --no-pager -l
    echo ""
    echo "=== Последние 100 строк логов ==="
    journalctl -u "$SERVICE_NAME" -n 100 --no-pager
else
    echo "Сервис не найден"
fi

echo ""
echo "=== 6. Проверка логов nginx (если используется) ==="
if [ -f /var/log/nginx/error.log ]; then
    echo "=== Последние 50 строк error.log ==="
    tail -50 /var/log/nginx/error.log
fi
if [ -f /var/log/nginx/access.log ]; then
    echo "=== Последние 20 строк access.log (только ошибки) ==="
    tail -100 /var/log/nginx/access.log | grep -E "502|500|error" | tail -20
fi

echo ""
echo "=== 7. Проверка директории server и package.json ==="
cd /var/www/e_presentati_usr/data/www/e-presentation.ru/server 2>/dev/null || cd "$(find /var/www -name "package.json" -path "*/server/package.json" 2>/dev/null | head -1 | xargs dirname 2>/dev/null)" 2>/dev/null || echo "Директория server не найдена"
if [ -f package.json ]; then
    pwd
    echo "=== Проверка установленных модулей ==="
    ls -la node_modules/@fastify/multipart 2>/dev/null && echo "✓ @fastify/multipart установлен" || echo "✗ @fastify/multipart НЕ установлен"
    ls -la node_modules/@fastify/static 2>/dev/null && echo "✓ @fastify/static установлен" || echo "✗ @fastify/static НЕ установлен"
    ls -la node_modules/sharp 2>/dev/null && echo "✓ sharp установлен" || echo "✗ sharp НЕ установлен"
    
    echo ""
    echo "=== Попытка запуска в режиме проверки ==="
    if [ -f dist/index.js ]; then
        echo "Скомпилированный файл найден: dist/index.js"
        node -e "console.log('Node.js работает')" 2>&1
    else
        echo "Файл dist/index.js не найден - нужна компиляция (npm run build)"
    fi
fi

echo ""
echo "=== 8. Проверка переменных окружения ==="
if [ -f .env ]; then
    echo "Файл .env найден"
    grep -E "DATABASE_URL|JWT_SECRET|PORT|NODE_ENV" .env | sed 's/\(.*=\)\(.*\)/\1****/' || echo "Переменные не найдены"
else
    echo "Файл .env не найден"
fi

echo ""
echo "=== 9. Проверка логов приложения (если есть) ==="
if [ -d logs ]; then
    echo "=== Последние 50 строк из logs/ ==="
    tail -50 logs/*.log 2>/dev/null || echo "Логи не найдены"
fi

echo ""
echo "=== 10. Попытка прямого подключения к backend (если известен порт) ==="
PORT=$(grep -E "PORT|listen" .env 2>/dev/null | grep -oE "[0-9]+" | head -1 || echo "3000")
echo "Проверка порта $PORT..."
curl -v http://localhost:$PORT/api/auth/me 2>&1 | head -20 || echo "Не удалось подключиться"
