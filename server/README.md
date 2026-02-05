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
- **`GIGACHAT_AUTH_KEY`** — ключ авторизации GigaChat (Base64, scope GIGACHAT_API_PERS) для генерации текста в редакторе презентаций. Без него кнопка «Сгенерировать текст (GigaChat)» не будет работать.
- **`YANDEX_GEOCODER_API_KEY`** — ключ Яндекс.Карт (JavaScript API и HTTP Геокодер) для подсказок адресов и поиска ближайшего метро. Без него подсказки при вводе адреса и кнопка «Найти ближайшее метро» не будут работать.
- **`PORT`** — порт сервера. Укажите тот же порт в корневом `.env` в переменной **`VITE_API_URL`** (например `http://localhost:3002`), чтобы фронтенд обращался к этому API.

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

### Редактор презентаций (подсказки, GigaChat, метро)

- `GET /suggest?q=...` — подсказки адресов при вводе (Яндекс Suggest). Ответ: `{ suggestions: [{ display_name, address, lat?, lon? }] }`.
- `GET /geocode?address=...` — координаты по адресу. Ответ: `{ success, lat, lng }`.
- `POST /find_nearest_metro` — ближайшие станции метро (body: `{ lat, lng }`). Ответ: `{ success, stations: [{ name, distance_text, walk_time_text, drive_time_text }] }`.
- `POST /generate_text` — генерация текста через GigaChat (body: `{ type: "description" | "infrastructure", prompt, object_title? }`). Ответ: `{ text }` или `{ error }`.

Для работы этих маршрутов в `server/.env` должны быть заданы **GIGACHAT_AUTH_KEY** и **YANDEX_GEOCODER_API_KEY** (см. `server/.env.example`).

## Производительность

- **Connection pool** (pg): до 20 соединений, быстрый повторное использование.
- **Индексы**: `users(email)`, `presentations(user_id)`, `presentations(updated_at)`.
- **JSONB** для контента слайдов: быстрые чтение/запись без денормализации.
- **JWT**: авторизация без обращения к БД на каждый запрос.

Frontend должен передавать заголовок `Authorization: Bearer <token>` для защищённых маршрутов.
