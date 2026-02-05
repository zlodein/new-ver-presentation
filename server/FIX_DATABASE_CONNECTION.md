# Исправление подключения к базе данных PostgreSQL

## Проблема

Формы авторизации/регистрации/восстановления пароля не работают с ошибкой:
> Ошибка сервера. Проверьте подключение к PostgreSQL и наличие таблиц (см. server/README.md). Точная причина — в логах бэкенда.

## Решение

### Шаг 1: Настройка DATABASE_URL в server/.env

1. Откройте файл `server/.env`
2. Найдите строку с `DATABASE_URL`
3. Убедитесь, что она имеет формат PostgreSQL:
   ```
   DATABASE_URL=postgresql://пользователь:пароль@хост:порт/база_данных
   ```

4. **ВАЖНО:** Замените `YOUR_PASSWORD_HERE` на реальный пароль пользователя базы данных `e_presentati`

   Пример правильной строки:
   ```
   DATABASE_URL=postgresql://e_presentati:ваш_реальный_пароль@localhost:5432/e_presentati
   ```

   **Если пароль содержит специальные символы** (например, `&`, `>`, `<`, `@`), их нужно закодировать в URL:
   - `@` → `%40`
   - `&` → `%26`
   - `>` → `%3E`
   - `<` → `%3C`
   - `;` → `%3B`
   - `:` → `%3A`
   - `/` → `%2F`
   - `?` → `%3F`
   - `#` → `%23`
   - `[` → `%5B`
   - `]` → `%5D`

   Или используйте альтернативный формат с переменными:
   ```env
   DB_USER=e_presentati
   DB_PASSWORD=ваш_пароль_со_спецсимволами
   DB_NAME=e_presentati
   DB_HOST=localhost
   DB_PORT=5432
   DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
   ```

### Шаг 2: Проверка подключения к базе данных

Выполните команду для проверки подключения:

```bash
cd server
npm run db:check
```

Скрипт проверит:
- ✅ Подключение к базе данных
- ✅ Наличие обязательных таблиц (`users`, `presentations`, `password_reset_tokens`)
- ✅ Структуру таблиц

Если подключение успешно, вы увидите:
```
✅ Подключение к базе данных успешно!
✅ Все обязательные таблицы присутствуют!
```

### Шаг 3: Создание таблиц (если их нет)

Если таблицы отсутствуют, выполните миграции:

**Вариант A — через Drizzle (рекомендуется):**
```bash
cd server
npm run db:push
```

**Вариант B — вручную через psql:**
```bash
psql -U e_presentati -d e_presentati -f drizzle/0000_init.sql
psql -U e_presentati -d e_presentati -f drizzle/0001_password_reset_tokens.sql
```

### Шаг 4: Проверка работы авторизации

После настройки подключения:

1. Перезапустите backend сервис:
   ```bash
   # Если используете systemd:
   systemctl restart presentation-backend
   
   # Или если запускаете вручную:
   cd server
   npm run start
   ```

2. Проверьте логи на наличие ошибок:
   ```bash
   # systemd:
   journalctl -u presentation-backend -n 50
   
   # Или в консоли, если запускаете вручную
   ```

3. Попробуйте зарегистрироваться или войти через форму авторизации

## Частые ошибки

### Ошибка: "password authentication failed"
- **Причина:** Неверный пароль в `DATABASE_URL`
- **Решение:** Проверьте пароль в `.env` файле

### Ошибка: "database does not exist"
- **Причина:** База данных `e_presentati` не существует
- **Решение:** Создайте базу данных:
  ```bash
  sudo -u postgres psql -c "CREATE DATABASE e_presentati;"
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE e_presentati TO e_presentati;"
  ```

### Ошибка: "relation does not exist"
- **Причина:** Таблицы не созданы в базе данных
- **Решение:** Выполните миграции (см. Шаг 3)

### Ошибка: "ECONNREFUSED" или "timeout"
- **Причина:** PostgreSQL не запущен или недоступен
- **Решение:** 
  ```bash
  # Проверьте статус PostgreSQL
  systemctl status postgresql
  
  # Запустите, если не запущен
  systemctl start postgresql
  ```

## Дополнительная информация

- Схема базы данных: `server/src/db/schema.ts`
- SQL миграции: `server/drizzle/0000_init.sql` и `server/drizzle/0001_password_reset_tokens.sql`
- Документация: `server/README.md`
