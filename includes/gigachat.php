<?php
/**
 * GigaChat API — получение токена и генерация текста.
 * Настройки в .env или константах: GIGACHAT_AUTH_KEY (Base64 ключ авторизации).
 */

if (!function_exists('gigachat_get_token')) {
    /**
     * Получить access token GigaChat (OAuth 2.0).
     * @return string|null access_token или null при ошибке
     */
    function gigachat_get_token() {
        $authKey = defined('GIGACHAT_AUTH_KEY') ? GIGACHAT_AUTH_KEY : (getenv('GIGACHAT_AUTH_KEY') ?: '');
        if (empty($authKey)) {
            error_log('GigaChat: GIGACHAT_AUTH_KEY не задан');
            return null;
        }

        $url = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
        $rqUid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000, random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff));

        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => [
                    'Content-Type: application/x-www-form-urlencoded',
                    'Accept: application/json',
                    'RqUID: ' . $rqUid,
                    'Authorization: Basic ' . $authKey,
                ],
                'content' => 'scope=GIGACHAT_API_PERS',
                'timeout' => 15,
            ],
        ]);

        $response = @file_get_contents($url, false, $context);
        if ($response === false) {
            error_log('GigaChat: ошибка запроса токена');
            return null;
        }

        $data = json_decode($response, true);
        return isset($data['access_token']) ? $data['access_token'] : null;
    }
}

if (!function_exists('gigachat_generate_text')) {
    /**
     * Сгенерировать текст через GigaChat.
     * @param string $prompt Текст запроса (или описание объекта)
     * @param string $type 'description' | 'infrastructure'
     * @return array ['success' => bool, 'text' => string|null, 'error' => string|null]
     */
    function gigachat_generate_text($prompt, $type = 'description') {
        $token = gigachat_get_token();
        if (!$token) {
            return ['success' => false, 'text' => null, 'error' => 'Не удалось получить токен GigaChat'];
        }

        $systemPrompt = $type === 'description'
            ? 'Ты помощник по описанию недвижимости. Кратко и по делу опиши объект для слайда презентации: транспортная доступность, местоположение, планировка, особенности. Пиши на русском, без заголовков, одним связным текстом до 3–4 предложений.'
            : 'Ты помощник по описанию инфраструктуры рядом с объектом недвижимости. Кратко перечисли, что находится рядом: детский сад, школа, магазины, торговые центры, транспорт. Пиши на русском, без заголовков, одним связным текстом до 3–4 предложений.';

        $userMessage = trim($prompt);
        if ($userMessage === '') {
            $userMessage = 'Опиши объект недвижимости в общих чертах.';
        }

        $payload = [
            'model' => 'GigaChat',
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userMessage],
            ],
            'temperature' => 0.7,
            'max_tokens' => 1024,
        ];

        $url = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => [
                    'Content-Type: application/json',
                    'Accept: application/json',
                    'Authorization: Bearer ' . $token,
                ],
                'content' => json_encode($payload),
                'timeout' => 60,
            ],
        ]);

        $response = @file_get_contents($url, false, $context);
        if ($response === false) {
            return ['success' => false, 'text' => null, 'error' => 'Ошибка запроса к GigaChat'];
        }

        $data = json_decode($response, true);
        if (isset($data['choices'][0]['message']['content'])) {
            $text = trim($data['choices'][0]['message']['content']);
            return ['success' => true, 'text' => $text, 'error' => null];
        }

        $error = isset($data['error']['message']) ? $data['error']['message'] : 'Неизвестная ошибка GigaChat';
        return ['success' => false, 'text' => null, 'error' => $error];
    }
}
