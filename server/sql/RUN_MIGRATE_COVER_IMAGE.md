# Миграция cover_image → LONGTEXT (MySQL)

Расширяет поле `cover_image` в таблице `presentations`, чтобы хранить base64-обложки (иначе они обрезаются и отображаются как битые).

---

## Выполнение из консоли сервера (кратко)

```bash
# 1. Подключиться к MySQL и посмотреть базы
mysql -u ВАШ_ПОЛЬЗОВАТЕЛЬ -p -e "SHOW DATABASES;"

# 2. Выбрать базу (имя из списка или из .env проекта) и выполнить миграцию
mysql -u ВАШ_ПОЛЬЗОВАТЕЛЬ -p ИМЯ_БАЗЫ -e "ALTER TABLE presentations MODIFY COLUMN cover_image longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;"

# Или из файла (если вы в каталоге проекта):
mysql -u ВАШ_ПОЛЬЗОВАТЕЛЬ -p ИМЯ_БАЗЫ < server/sql/migrate_cover_image_longtext.sql
```

Замените `ВАШ_ПОЛЬЗОВАТЕЛЬ` и `ИМЯ_БАЗЫ` на реальные значения (пароль запросит `mysql`).

**Узнать имя базы из .env проекта:**
```bash
cd /путь/к/проекту/server
grep DATABASE_URL .env
# Имя базы — часть после последнего / в mysql://.../имя_базы
```

---

## 1. Найти базу данных

Подключитесь к MySQL и посмотрите список баз:

```bash
mysql -u ВАШ_ПОЛЬЗОВАТЕЛЬ -p -e "SHOW DATABASES;"
```

Или в интерактивной консоли MySQL:

```sql
SHOW DATABASES;
```

Обычно база для презентаций называется вроде `cq88845_present`, `e_presentati` или как в `DATABASE_URL` в `server/.env` (часть после последнего `/`).

Проверить, что в базе есть таблица `presentations`:

```sql
USE имя_базы;
SHOW TABLES LIKE 'presentations';
DESCRIBE presentations;
```

Убедитесь, что есть колонка `cover_image` (тип может быть `varchar(255)`).

## 2. Выполнить миграцию

**Вариант A — из командной строки (подставить свои значения):**

```bash
mysql -u ВАШ_ПОЛЬЗОВАТЕЛЬ -p ИМЯ_БАЗЫ < server/sql/migrate_cover_image_longtext.sql
```

Пример:

```bash
mysql -u cq88845_present -p cq88845_present < server/sql/migrate_cover_image_longtext.sql
```

**Вариант B — из консоли MySQL:**

```sql
USE имя_базы;

ALTER TABLE `presentations`
  MODIFY COLUMN `cover_image` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
```

**Вариант C — взять имя базы из server/.env (PowerShell):**

```powershell
cd c:\presentation\new-ver-presentation
$envContent = Get-Content server\.env -Raw
if ($envContent -match 'mysql://[^/]+/([^?\s]+)') { $db = $Matches[1]; Write-Host "Database: $db"; mysql -u USER -p $db < server\sql\migrate_cover_image_longtext.sql }
```

Подставьте вместо `USER` реальное имя пользователя; пароль запросит MySQL.

## 3. Проверка

После миграции:

```sql
USE имя_базы;
DESCRIBE presentations;
```

У колонки `cover_image` должен быть тип `longtext`.
