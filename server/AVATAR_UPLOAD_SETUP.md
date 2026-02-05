# Настройка загрузки аватаров

## Установка зависимостей

Выполните в директории `server`:

```bash
npm install fastify-multipart @fastify/static sharp
```

## Создание папки для аватаров

Папка `server/uploads/avatars` будет создана автоматически при первой загрузке аватара.

Или создайте вручную:

```bash
mkdir -p server/uploads/avatars
```

## Настройка прав доступа

Убедитесь, что папка `server/uploads/avatars` имеет права на запись:

```bash
chmod 755 server/uploads/avatars
```

## API Endpoints

- `POST /api/upload/avatar` - Загрузка аватара (требует авторизации)
- `DELETE /api/upload/avatar` - Удаление аватара (требует авторизации)

## Формат сохранения

- Изображения сохраняются в `server/uploads/avatars/`
- Имя файла: `{userId}_{timestamp}.jpg`
- Размер: 400x400px (автоматическая обрезка до квадрата)
- Формат: JPEG, качество 90%
- Путь в БД: `/uploads/avatars/{filename}`

## Статические файлы

Статические файлы из папки `server/uploads` доступны по пути `/uploads/*`
