# Backend: API и база данных

Сервер на **Fastify** + **Drizzle ORM** + **PostgreSQL** для максимальной скорости обработки запросов.

## Требования

- Node.js 18+
- PostgreSQL 14+

## Установка

```bash
cd server
npm install
```

## Настройка

Скопируйте `server/.env.example` в `server/.env` и задайте:

- `JWT_SECRET` — секрет для JWT (не менее 32 символов)
- `PORT` — порт сервера (по умолчанию 3001)
- **`DATABASE_URL`** — не обязателен. Если **не задан** или пустой, данные хранятся в файле **`server/data/store.json`** (регистрация, вход и презентации работают без установки PostgreSQL). Если задан — используется PostgreSQL, например:  
  `postgresql://user:password@localhost:5432/presentation_db`

## Создание базы данных (только при использовании PostgreSQL)

1. Создайте БД в PostgreSQL:
   ```sql
   CREATE DATABASE presentation_db;
   ```

2. Примените схему одним из способов:

   **Вариант A — выполнить SQL вручную:**
   ```bash
   psql -U user -d presentation_db -f drizzle/0000_init.sql
   psql -U user -d presentation_db -f drizzle/0001_password_reset_tokens.sql
   ```

   **Вариант B — синхронизация через Drizzle (без миграций):**
   ```bash
   npm run db:push
   ```

3. **Ваши данные для входа (опционально):** задайте в `server/.env`:
   - `SEED_USER_EMAIL` — ваш email
   - `SEED_USER_PASSWORD` — ваш пароль (не менее 6 символов)
   - при необходимости `SEED_USER_FIRST_NAME`, `SEED_USER_LAST_NAME`  
   Затем выполните:
   ```bash
   npm run db:seed
   ```
   Будет создан или обновлён пользователь с этим email и паролем.

## Запуск

- Разработка (с перезапуском при изменениях):
  ```bash
  npm run dev
  ```

- Продакшен:
  ```bash
  npm run build
  npm run start
  ```

## API

- `POST /api/auth/register` — регистрация (body: email, password, firstName?, lastName?)
- `POST /api/auth/login` — вход (body: email, password)
- `GET /api/auth/me` — текущий пользователь (заголовок `Authorization: Bearer <token>`)
- `POST /api/auth/forgot-password` — запрос сброса пароля (body: email); в dev возвращает ссылку с токеном
- `POST /api/auth/reset-password` — сброс пароля по токену (body: token, newPassword)
- `GET /api/presentations` — список презентаций пользователя
- `GET /api/presentations/:id` — одна презентация
- `POST /api/presentations` — создать (body: title?, coverImage?, content?)
- `PUT /api/presentations/:id` — обновить
- `DELETE /api/presentations/:id` — удалить

## Производительность

- **Connection pool** (pg): до 20 соединений, быстрый повторное использование.
- **Индексы**: `users(email)`, `presentations(user_id)`, `presentations(updated_at)`.
- **JSONB** для контента слайдов: быстрые чтение/запись без денормализации.
- **JWT**: авторизация без обращения к БД на каждый запрос.

Frontend должен передавать заголовок `Authorization: Bearer <token>` для защищённых маршрутов.
