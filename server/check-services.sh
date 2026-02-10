#!/bin/bash
# Быстрая проверка сервисов на удалённом сервере (systemd + Nginx)
# Запуск: bash check-services.sh  (или chmod +x check-services.sh && ./check-services.sh)

echo "=== 1. Статус backend (systemd) ==="
systemctl is-active presentation-backend 2>/dev/null && echo "presentation-backend: запущен" || echo "presentation-backend: НЕ запущен"
systemctl status presentation-backend --no-pager -l 2>/dev/null | head -15

echo ""
echo "=== 2. Порт 3001 (backend) ==="
ss -tlnp 2>/dev/null | grep 3001 || netstat -tlnp 2>/dev/null | grep 3001 || echo "Порт 3001 не слушается"

echo ""
echo "=== 3. Проверка API локально ==="
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/auth/me 2>/dev/null && echo " — запрос к /api/auth/me выполнен" || echo "Не удалось подключиться к backend (127.0.0.1:3001)"

echo ""
echo "=== 4. Nginx (если конфиг от setup-server) ==="
systemctl is-active nginx 2>/dev/null && echo "nginx: запущен" || echo "nginx: проверьте через FastPanel"
ss -tlnp 2>/dev/null | grep -E ':80 |:443 ' || true

echo ""
echo "=== 5. Последние логи backend (при ошибках) ==="
journalctl -u presentation-backend -n 20 --no-pager 2>/dev/null || echo "Сервис не найден или нет логов"
