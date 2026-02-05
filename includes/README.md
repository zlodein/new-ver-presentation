# API для редактора презентаций

## Настройка ключей

1. **Скопируйте конфиг и укажите ключи:**
   ```bash
   cp presentation-api-config.example.php presentation-api-config.php
   ```
   В `presentation-api-config.php` уже подставлены ваши ключи (GigaChat, Yandex). При необходимости замените их или задайте через переменные окружения.

2. **Либо задайте переменные окружения** (без создания `presentation-api-config.php`):
   - `GIGACHAT_AUTH_KEY` — ключ авторизации GigaChat (Base64: client_id:client_secret), scope: GIGACHAT_API_PERS
   - `YANDEX_GEOCODER_API_KEY` — ключ JavaScript API и HTTP Геокодера Яндекс.Карт (подсказки адресов, геокодирование, ближайшее метро)
   - `YANDEX_STATIC_API_KEY` — ключ Static API Яндекс.Карт (статичные карты)

## Возможности

- **GigaChat** (`gigachat.php`) — генерация текста для слайдов «Описание» и «Инфраструктура» (action `generate_text`).
- **Yandex** (`yandex-maps-helper.php`) — подсказки адресов при вводе (`suggest`), геокодирование (`geocode`), поиск ближайших станций метро (`find_nearest_metro`).

## Точка входа API

Обработчики вызываются из вашего `api.php` (или аналога) через `handlePresentationRequest($action)`. Поддерживаемые действия: `generate_text`, `suggest`, `geocode`, `find_nearest_metro`, а также остальные из `presentations.php`.
