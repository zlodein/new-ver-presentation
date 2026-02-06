# Миграция cover_image → LONGTEXT (MySQL)

**Симптом:** при загрузке обложки в слайде всё ок, после сохранения и повторного входа картинка битая. В базе в `cover_image` видна только начало строки (`data:image/jpeg;base64,/9j/4AAQ...`), потому что колонка имеет тип **varchar(255)** и обрезает длинный base64.

Расширяет поле `cover_image` в таблице `presentations` до **longtext**, чтобы хранить полный base64 (иначе обложки обрезаются и отображаются как битые).

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

## 1. Проверить текущий тип колонки (MySQL)

Чтобы убедиться, что обложки режутся из‑за типа поля:

```sql
USE имя_базы;
DESCRIBE presentations;
```

Если у `cover_image` тип **varchar(255)** (или другой с лимитом) — нужна миграция ниже. Если уже **longtext** — миграция не нужна.

## 2. Найти базу данных

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

## 3. Выполнить миграцию

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

## 4. Проверка

После миграции:

```sql
USE имя_базы;
DESCRIBE presentations;
```

У колонки `cover_image` должен быть тип `longtext`.
