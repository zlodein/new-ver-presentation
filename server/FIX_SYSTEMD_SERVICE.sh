#!/bin/bash
# Скрипт для исправления systemd сервиса

echo "=== 1. Проверка текущего файла сервиса ==="
cat /etc/systemd/system/presentation-backend.service

echo ""
echo "=== 2. Обновление ExecStart на index.js ==="
sudo sed -i 's|ExecStart=/usr/bin/node dist/index.js|ExecStart=/usr/bin/node index.js|' /etc/systemd/system/presentation-backend.service

echo ""
echo "=== 3. Проверка обновленного файла ==="
cat /etc/systemd/system/presentation-backend.service

echo ""
echo "=== 4. Перезагрузка systemd ==="
sudo systemctl daemon-reload

echo ""
echo "=== 5. Перезапуск сервиса ==="
sudo systemctl restart presentation-backend

echo ""
echo "=== 6. Статус сервиса ==="
sudo systemctl status presentation-backend --no-pager -l

echo ""
echo "=== 7. Последние логи ==="
journalctl -u presentation-backend -n 30 --no-pager
