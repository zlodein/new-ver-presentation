<?php
/**
 * Пример конфигурации API для презентаций.
 * Скопируйте в presentation-api-config.php и укажите свои ключи.
 * Либо задайте переменные окружения: GIGACHAT_AUTH_KEY, YANDEX_GEOCODER_API_KEY, YANDEX_STATIC_API_KEY.
 */

if (!defined('GIGACHAT_AUTH_KEY') && getenv('GIGACHAT_AUTH_KEY') === false) {
    // Ключ авторизации GigaChat (Base64: client_id:client_secret). Scope: GIGACHAT_API_PERS
    define('GIGACHAT_AUTH_KEY', 'MGM1Y2Q0NTktYjAxNy00YzQzLTg5YWMtZjBlYjcyMmY4NTg1OjVlMjA4ZWI3LWU2Y2UtNGUxZS1hYmJmLWVhYWI2MmQzNDUzZQ==');
}

if (!defined('YANDEX_GEOCODER_API_KEY') && getenv('YANDEX_GEOCODER_API_KEY') === false) {
    // JavaScript API и HTTP Геокодер Яндекс.Карт
    define('YANDEX_GEOCODER_API_KEY', '0d3f02e3-3a2a-426d-a3a1-9952dcb199b9');
}

if (!defined('YANDEX_STATIC_API_KEY') && getenv('YANDEX_STATIC_API_KEY') === false) {
    // Static API Яндекс.Карт (статичные картинки карт)
    define('YANDEX_STATIC_API_KEY', 'c3cb2b6f-af48-4850-95c6-7630afba5848');
}
