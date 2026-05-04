#!/bin/bash
# Находит базу из server/.env (DATABASE_URL) и выполняет миграцию cover_image → LONGTEXT.
# Использование: из корня проекта или из server/
#   ./server/sql/run_migrate_cover_image.sh
# Или с явным указанием пользователя MySQL:
#   MYSQL_USER=myuser ./server/sql/run_migrate_cover_image.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$SERVER_DIR/.env"
MIGRATION_FILE="$SCRIPT_DIR/migrate_cover_image_longtext.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Файл миграции не найден: $MIGRATION_FILE"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Файл .env не найден: $ENV_FILE"
  echo "Укажите базу и пользователя вручную:"
  echo "  mysql -u USER -p DATABASE < $MIGRATION_FILE"
  exit 1
fi

# Извлечь DATABASE_URL (mysql://user:password@host:port/dbname или mysql://user:password@host/dbname)
DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'")
if [ -z "$DATABASE_URL" ] || [[ ! "$DATABASE_URL" =~ ^mysql ]]; then
  echo "В .env не найден DATABASE_URL с mysql://"
  echo "Выполните вручную: mysql -u USER -p DATABASE < $MIGRATION_FILE"
  exit 1
fi

# Парсим: user:password@host/dbname или user:password@host:port/dbname
# Упрощённо: берём часть после последнего / до ? или конца
DB_NAME=$(echo "$DATABASE_URL" | sed -E 's|.*/([^/?]+).*|\1|')
# user — часть между mysql:// и первым :
MYSQL_USER="${MYSQL_USER:-$(echo "$DATABASE_URL" | sed -E 's|mysql://([^:]+):.*|\1|')}"
# host — между @ и / или :
MYSQL_HOST="${MYSQL_HOST:-$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')}"
MYSQL_HOST="${MYSQL_HOST:-localhost}"

echo "База: $DB_NAME, пользователь: $MYSQL_USER, хост: $MYSQL_HOST"
echo "Выполняю миграцию..."
mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p "$DB_NAME" < "$MIGRATION_FILE"
echo "Готово."
