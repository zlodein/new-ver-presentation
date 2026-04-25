#!/usr/bin/env bash
# Вызывается на сервере после scp файлов в /tmp (CI или scripts/deploy.sh).
# FastPanel2: /etc/nginx/fastpanel2-sites/<user>/e-presentation.ru.includes
# Иначе: полный server в sites-available.

set -euo pipefail

FP_DIR="/etc/nginx/fastpanel2-sites/e_presentati_usr"
INC="${FP_DIR}/e-presentation.ru.includes"
SITE_CONF="/etc/nginx/sites-available/e-presentation"
TMP_FP="/tmp/nginx-fastpanel-e-presentation.ru.includes"
TMP_STANDALONE="/tmp/nginx-standalone-e-presentation.conf"

if [[ ! -f "$TMP_FP" || ! -f "$TMP_STANDALONE" ]]; then
  echo "Ожидаются файлы: $TMP_FP и $TMP_STANDALONE (скопируйте через scp перед запуском)." >&2
  exit 1
fi

if [[ -d "$FP_DIR" ]]; then
  mkdir -p "$FP_DIR"
  if [[ -f "$INC" ]]; then
    cp "$INC" "${INC}.backup.$(date +%Y%m%d-%H%M%S)"
  fi
  install -m 0644 "$TMP_FP" "$INC"
  echo "Обновлён FastPanel includes: $INC"
else
  mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
  if [[ -f "$SITE_CONF" ]]; then
    cp "$SITE_CONF" "${SITE_CONF}.backup.$(date +%Y%m%d-%H%M%S)"
  fi
  install -m 0644 "$TMP_STANDALONE" "$SITE_CONF"
  ln -sf "$SITE_CONF" /etc/nginx/sites-enabled/e-presentation
  echo "Обновлён standalone vhost: $SITE_CONF"
fi

rm -f "$TMP_FP" "$TMP_STANDALONE"

nginx -t
systemctl reload nginx
echo "Nginx перезагружен (SPA try_files активен)."
