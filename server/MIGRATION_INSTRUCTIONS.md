# Инструкция по выполнению миграции базы данных

## Создание таблицы `presentation_views`

Для работы счетчика просмотров презентаций необходимо создать таблицу в базе данных MySQL.

## Способ 1: Через командную строку MySQL (рекомендуется)

### Шаг 1: Подключитесь к MySQL

```bash
mysql -u ваш_пользователь -p ваша_база_данных
```

Или если MySQL на удаленном сервере:
```bash
mysql -h ваш_хост -u ваш_пользователь -p ваша_база_данных
```

### Шаг 2: Выполните SQL-скрипт

После подключения выполните:

```sql
source server/drizzle/0002_presentation_views.sql;
```

Или скопируйте содержимое файла `server/drizzle/0002_presentation_views.sql` и вставьте в консоль MySQL.

### Шаг 3: Проверьте создание таблицы

```sql
SHOW TABLES LIKE 'presentation_views';
DESCRIBE presentation_views;
```

## Способ 2: Через Node.js скрипт

### Шаг 1: Убедитесь, что в `server/.env` настроен `DATABASE_URL`

```env
DATABASE_URL=mysql://пользователь:пароль@хост:порт/база_данных
```

Например:
```env
DATABASE_URL=mysql://root:password@localhost:3306/e_presentati
```

### Шаг 2: Выполните скрипт

```bash
cd server
node scripts/run-migration.js drizzle/0002_presentation_views.sql
```

## Способ 3: Через phpMyAdmin или другой GUI-клиент

1. Откройте phpMyAdmin (или другой клиент MySQL)
2. Выберите вашу базу данных
3. Перейдите на вкладку "SQL"
4. Скопируйте содержимое файла `server/drizzle/0002_presentation_views.sql`
5. Вставьте в поле SQL-запроса
6. Нажмите "Выполнить"

## Способ 4: Через Drizzle ORM (автоматическая синхронизация)

Если у вас настроен Drizzle для MySQL, можно использовать:

```bash
cd server
npm run db:push
```

**Внимание:** Этот способ создаст все таблицы из схемы, включая новые. Убедитесь, что это то, что вам нужно.

## Проверка результата

После выполнения миграции проверьте, что таблица создана:

```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'ваша_база_данных' 
AND table_name = 'presentation_views';
```

Должно вернуть `1`.

## Содержимое миграции

Миграция создает таблицу `presentation_views` со следующими полями:
- `id` - уникальный идентификатор просмотра
- `presentation_id` - ID презентации (связь с таблицей `presentations`)
- `viewed_at` - дата и время просмотра
- `ip_address` - IP-адрес посетителя (опционально)
- `user_agent` - информация о браузере (опционально)

## Устранение проблем

### Ошибка: "Table already exists"

Если таблица уже существует, это нормально. Миграция использует `CREATE TABLE IF NOT EXISTS`, поэтому повторное выполнение безопасно.

### Ошибка: "Access denied"

Убедитесь, что пользователь MySQL имеет права на создание таблиц:
```sql
GRANT ALL PRIVILEGES ON ваша_база_данных.* TO 'ваш_пользователь'@'localhost';
FLUSH PRIVILEGES;
```

### Ошибка подключения

Проверьте:
- MySQL сервер запущен
- Правильность данных в `DATABASE_URL`
- Доступность хоста и порта
- Правильность имени базы данных
