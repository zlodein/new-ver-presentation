# Схема БД e_presentati (MySQL)

Скрипт `e_presentati_schema.sql` создаёт таблицы и поля по образцу старой БД (cq88845_present.sql). База подходит для новой версии сайта презентаций.

## Применение схемы

**Вариант 1 — из командной строки (база уже создана):**

```bash
mysql -h localhost -u root -p e_presentati < server/sql/e_presentati_schema.sql
```

Пароль: `Thice7UyooXeoboh` (или ваш пароль root).

**Вариант 2 — из клиента MySQL:**

```sql
SOURCE /полный/путь/к/project/server/sql/e_presentati_schema.sql;
```

Скрипт сам создаёт базу `e_presentati`, если её ещё нет, и заполняет справочники `user_roles` и `tariffs`.

## Подключение бэкенда

В `server/.env` укажите:

```
DATABASE_URL=mysql://root:Thice7UyooXeoboh@localhost:3306/e_presentati
```

Запуск сервера: из папки `server` выполните `npm run dev` или `npm start`.
