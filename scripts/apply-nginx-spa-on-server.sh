#!/usr/bin/env bash
# Вызывается на сервере после scp файлов в /tmp (CI или scripts/deploy.sh).
# FastPanel2: includes — только /api; try_files для SPA — в основном *.conf сайта (один location /).

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

cleanup_tmp() {
  rm -f "$TMP_FP" "$TMP_STANDALONE"
}

# Вставка try_files в первый блок location / { ... } основного vhost FastPanel (без второго location / в includes).
patch_main_conf_spa_try_files() {
  local main_conf="$1"
  [[ -f "$main_conf" ]] || return 0
  if grep -qF 'try_files $uri $uri/ /index.html' "$main_conf"; then
    echo "Уже есть SPA try_files в: $main_conf"
    return 0
  fi
  cp "$main_conf" "${main_conf}.backup.spa.$(date +%Y%m%d-%H%M%S)"
  if ! command -v python3 >/dev/null 2>&1; then
    echo "python3 не найден — не могу пропатчить $main_conf для SPA. Установите python3 или добавьте try_files вручную." >&2
    return 1
  fi
  export MAIN_CONF_PATH="$main_conf"
  python3 <<'PY'
import os, re, sys
path = os.environ["MAIN_CONF_PATH"]
spa_line = "        try_files $uri $uri/ /index.html;"
text = open(path, encoding="utf-8", errors="replace").read()
if "try_files $uri $uri/ /index.html" in text:
    raise SystemExit(0)
# Частые шаблоны панелей / статики
for pat in (
    r"try_files\s+\$uri\s+\$uri/\s*=\s*404\s*;",
    r"try_files\s+\$uri\s+\$uri/\s*=\s*403\s*;",
):
    new, n = re.subn(pat, spa_line + "\n", text, count=1)
    if n:
        open(path, "w", encoding="utf-8").write(new)
        raise SystemExit(0)
# Вставить сразу после открывающей скобки первого location / (в т.ч. «{» на следующей строке)
m = re.search(r"location\s*/\s*(?:\{|\n\s*\{)", text)
if not m:
    print("Не найден блок location / в", path, file=sys.stderr)
    sys.exit(1)
insert_at = m.end()
rest = text[insert_at : insert_at + 200]
if re.match(r"\s*try_files", rest):
    raise SystemExit(0)
nl = "\n" if text[insert_at : insert_at + 1] != "\n" else ""
insertion = nl + spa_line + "\n"
open(path, "w", encoding="utf-8").write(text[:insert_at] + insertion + text[insert_at:])
PY
  echo "Пропатчен SPA try_files в: $main_conf"
}

if [[ -d "$FP_DIR" ]]; then
  mkdir -p "$FP_DIR"
  if [[ -f "$INC" ]]; then
    cp "$INC" "${INC}.backup.$(date +%Y%m%d-%H%M%S)"
  fi
  install -m 0644 "$TMP_FP" "$INC"
  echo "Обновлён FastPanel includes: $INC"

  MAIN_CONF=""
  shopt -s nullglob
  for f in "${FP_DIR}"/*.conf; do
    [[ -f "$f" ]] || continue
    case "$f" in
      *.includes|*.includes.*) continue ;;
    esac
    if grep -qE 'e-presentation\.ru|www\.e-presentation\.ru' "$f" 2>/dev/null; then
      MAIN_CONF="$f"
      break
    fi
  done
  shopt -u nullglob
  if [[ -z "$MAIN_CONF" ]]; then
    for f in "${FP_DIR}/e-presentation.ru.conf" "${FP_DIR}/e-presentation.conf"; do
      if [[ -f "$f" ]]; then
        MAIN_CONF="$f"
        break
      fi
    done
  fi
  if [[ -n "${MAIN_CONF:-}" ]]; then
    patch_main_conf_spa_try_files "$MAIN_CONF"
  else
    echo "Предупреждение: не найден основной *.conf в $FP_DIR — добавьте вручную в location /: try_files \$uri \$uri/ /index.html;" >&2
  fi
else
  mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
  if [[ -f "$SITE_CONF" ]]; then
    cp "$SITE_CONF" "${SITE_CONF}.backup.$(date +%Y%m%d-%H%M%S)"
  fi
  install -m 0644 "$TMP_STANDALONE" "$SITE_CONF"
  ln -sf "$SITE_CONF" /etc/nginx/sites-enabled/e-presentation
  echo "Обновлён standalone vhost: $SITE_CONF"
fi

nginx -t
systemctl reload nginx
cleanup_tmp
echo "Nginx перезагружен (SPA try_files активен)."
