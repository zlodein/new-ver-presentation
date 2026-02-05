#!/bin/bash
# Скрипт для исправления проблем с компиляцией

cd /var/www/e_presentati_usr/data/www/e-presentation.ru/server

echo "=== 1. Проверка текущей директории и файлов ==="
pwd
ls -la | head -20

echo ""
echo "=== 2. Проверка наличия src директории ==="
if [ -d src ]; then
    echo "✓ src директория найдена"
    ls -la src/ | head -10
else
    echo "✗ src директория не найдена!"
    exit 1
fi

echo ""
echo "=== 3. Проверка tsconfig.json ==="
if [ -f tsconfig.json ]; then
    echo "✓ tsconfig.json найден"
else
    echo "✗ tsconfig.json не найден, создаем..."
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
    echo "✓ tsconfig.json создан"
fi

echo ""
echo "=== 4. Компиляция TypeScript ==="
npx tsc -p tsconfig.json

echo ""
echo "=== 5. Проверка результата ==="
if [ -f dist/index.js ]; then
    echo "✓ dist/index.js создан успешно"
    ls -lh dist/index.js
else
    echo "✗ dist/index.js не создан!"
    echo "Проверка ошибок компиляции:"
    npx tsc -p tsconfig.json 2>&1 | tail -20
    exit 1
fi

echo ""
echo "=== 6. Перезапуск сервиса ==="
systemctl restart presentation-backend
sleep 2
systemctl status presentation-backend --no-pager -l

echo ""
echo "=== 7. Проверка логов ==="
journalctl -u presentation-backend -n 20 --no-pager
