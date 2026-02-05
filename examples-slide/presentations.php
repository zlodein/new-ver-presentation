<?php
// Конфиг API (ключи GigaChat, Yandex) — опционально, можно задать через env
if (file_exists(__DIR__ . '/../includes/presentation-api-config.php')) {
    require_once __DIR__ . '/../includes/presentation-api-config.php';
}
// Подключаем хелпер для работы с Яндекс.Картами
require_once __DIR__ . '/../includes/yandex-maps-helper.php';

// Функция для получения данных профиля для автозаполнения контактов
function getProfileDataForPresentation($userId) {
    if (!$userId) {
        return null;
    }
    
    try {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            return null;
        }
        
        // Получаем настройки вывода
        $displaySettings = [
            'photo_type' => 'personal',
            'name_type' => 'personal',
            'show_position' => false,
            'phone_type' => 'personal',
            'show_messengers' => false
        ];
        if (!empty($user['presentation_display_settings'])) {
            $decoded = json_decode($user['presentation_display_settings'], true);
            if (is_array($decoded)) {
                $displaySettings = array_merge($displaySettings, $decoded);
            }
        }
        
        // Получаем мессенджеры
        $messengers = [];
        if (!empty($user['messengers'])) {
            $decoded = json_decode($user['messengers'], true);
            if (is_array($decoded)) {
                $messengers = $decoded;
            }
        }
        
        // Формируем данные для автозаполнения на основе настроек
        $contactData = [
            'avatar' => '',
            'name' => '',
            'role' => '',
            'phone' => '',
            'messengers' => ''
        ];
        
        // Фото/лого
        if ($displaySettings['photo_type'] === 'company' && !empty($user['company_logo'])) {
            $contactData['avatar'] = $user['company_logo'];
        } elseif ($displaySettings['photo_type'] === 'personal' && !empty($user['user_img'])) {
            $contactData['avatar'] = $user['user_img'];
        }
        
        // ФИО/название
        if ($displaySettings['name_type'] === 'company' && !empty($user['workplace'])) {
            $contactData['name'] = $user['workplace'];
        } elseif ($displaySettings['name_type'] === 'personal') {
            $nameParts = array_filter([
                $user['name'] ?? '',
                $user['last_name'] ?? '',
                $user['middle_name'] ?? ''
            ]);
            $contactData['name'] = implode(' ', $nameParts);
        }
        
        // Должность
        if ($displaySettings['show_position'] && !empty($user['position'])) {
            $contactData['role'] = $user['position'];
        }
        
        // Телефон
        if ($displaySettings['phone_type'] === 'work' && !empty($user['work_phone'])) {
            $contactData['phone'] = $user['work_phone'];
        } elseif ($displaySettings['phone_type'] === 'personal' && !empty($user['personal_phone'])) {
            $contactData['phone'] = $user['personal_phone'];
        }
        
        // Мессенджеры
        if ($displaySettings['show_messengers'] && !empty($messengers)) {
            $messengerNames = array_map(function($m) {
                $names = [
                    'whatsapp' => 'WhatsApp',
                    'telegram' => 'Telegram',
                    'vk' => 'ВКонтакте',
                    'viber' => 'Viber'
                ];
                return $names[$m] ?? ucfirst($m);
            }, $messengers);
            $contactData['messengers'] = implode(' | ', $messengerNames);
        }
        
        // Возвращаем данные только если хотя бы что-то заполнено
        $hasData = !empty($contactData['avatar']) || !empty($contactData['name']) || 
                   !empty($contactData['role']) || !empty($contactData['phone']) || 
                   !empty($contactData['messengers']);
        
        return $hasData ? $contactData : null;
    } catch (Exception $e) {
        // В случае любой ошибки возвращаем null, чтобы не нарушить создание презентации
        error_log("Error in getProfileDataForPresentation: " . $e->getMessage());
        return null;
    }
}

function handlePresentationRequest($action) {
    global $method;
    
    switch ($action) {
        case 'create_presentation':
            requireAuth();
            
            $userId = getCurrentUserId();
            error_log("create_presentation: User ID = {$userId}, Method = {$method}");
            
            if ($method !== 'POST') {
                error_log("create_presentation: Invalid method {$method}");
                jsonResponse(['error' => 'Метод не разрешён'], 405);
            }
            
            $title = trim($_POST['title'] ?? '');
            $description = trim($_POST['description'] ?? '');
            $csrfToken = $_POST['csrf_token'] ?? '';
            
            error_log("create_presentation: CSRF token received = " . (!empty($csrfToken) ? 'yes' : 'no'));
            
            if (!verifyCsrfToken($csrfToken)) {
                error_log("create_presentation: CSRF token verification failed");
                jsonResponse(['error' => 'Недействительный токен'], 403);
            }
            
            // Проверяем тариф перед созданием
            $tariffModel = new Tariff();
            $canCreate = $tariffModel->canCreatePresentation($userId);
            error_log("create_presentation: canCreatePresentation = " . ($canCreate ? 'true' : 'false'));
            
            if (!$canCreate) {
                // Получаем дополнительную информацию для логирования
                $tariff = $tariffModel->getUserTariff($userId);
                $stats = $tariffModel->getUserStats($userId);
                error_log("create_presentation: Tariff = " . print_r($tariff, true));
                error_log("create_presentation: Stats = " . print_r($stats, true));
                
                // Если тариф не выбран, показываем соответствующее сообщение
                if (!$tariff) {
                    jsonResponse(['success' => false, 'error' => 'Вы не выбрали тариф для продолжения работы. Обновите тариф.'], 403);
                } else {
                    jsonResponse(['success' => false, 'error' => 'Вы исчерпали лимит презентаций по текущему тарифу. Обновите тариф.'], 403);
                }
            }
            
            if (empty($title)) {
                jsonResponse(['error' => 'Укажите название презентации'], 400);
            }
            
            $presentationModel = new Presentation();
            
            // Все типы слайдов с изображениями-заглушками
            $defaultSlides = [
                // 1. Обложка
                [
                    'type' => 'cover',
                    'title' => 'ЭКСКЛЮЗИВНОЕ<br>ПРЕДЛОЖЕНИЕ',
                    'subtitle' => 'АБСОЛЮТНО НОВЫЙ ТАУНХАУС<br>НА ПЕРВОЙ ЛИНИИ',
                    'deal_type' => 'Аренда',
                    'currency' => 'RUB',
                    'price_value' => 1000000,
                    'price' => '1 000 000 ₽ / месяц',
                    'background_image' => '/assets/uploads/default-image/3-img.jpg',
                    'show_currencies' => false,
                    'hidden' => false
                ],
                
                // 2. Изображение (одиночное)
                [
                    'type' => 'image',
                    'image' => '/assets/uploads/default-image/1-img.jpg',
                    'hidden' => false
                ],
                
                // 3. Галерея (3 изображения)
                [
                    'type' => 'gallery',
                    'images' => [
                        '/assets/uploads/default-image/2-img.jpg',
                        '/assets/uploads/default-image/4-img.jpg',
                        '/assets/uploads/default-image/5-img.jpg'
                    ],
                    'hidden' => false
                ],
                
                // 4. Характеристики
                [
                    'type' => 'characteristics',
                    'title' => 'ХАРАКТЕРИСТИКИ',
                    'image' => '/assets/uploads/default-image/6-img.jpg',
                    'items' => [
                        ['label' => 'Площадь квартиры:', 'value' => '350 кв.м.'],
                        ['label' => 'Количество комнат:', 'value' => '5'],
                        ['label' => 'Высота потолков:', 'value' => '3.2 м'],
                        ['label' => 'Ремонт:', 'value' => 'Евро'],
                        ['label' => 'Санузел:', 'value' => '2 раздельных'],
                        ['label' => 'Балкон:', 'value' => '2 застекленных'],
                        ['label' => 'Вид из окон:', 'value' => 'На парк'],
                        ['label' => 'Год постройки:', 'value' => '2023'],
                        ['label' => 'Парковка:', 'value' => 'Подземная'],
                        ['label' => 'Лифт:', 'value' => '2 пассажирских']
                    ],
                    'hidden' => false
                ],
                
                // 5. Сетка (4 изображения)
                [
                    'type' => 'grid',
                    'images' => [
                        '/assets/uploads/default-image/7-img.jpg',
                        '/assets/uploads/default-image/8-img.jpg',
                        '/assets/uploads/default-image/9-img.jpg',
                        '/assets/uploads/default-image/10-img.jpg'
                    ],
                    'hidden' => false
                ],
                
                // 6. Описание
                [
                    'type' => 'description',
                    'title' => 'ОПИСАНИЕ',
                    'content' => 'Эксклюзивный таунхаус на первой линии с видом на море. Современный дизайн, панорамное остекление, приватная терраса. Идеальное сочетание комфорта и престижа.',
                    'images' => [
                        '/assets/uploads/default-image/11-img.jpg',
                        '/assets/uploads/default-image/12-img.jpg'
                    ],
                    'hidden' => false
                ],
                
                // 7. Инфраструктура
                [
                    'type' => 'infrastructure',
                    'title' => 'ИНФРАСТРУКТУРА',
                    'content' => 'В шаговой доступности: пляж, рестораны, спа-центр, фитнес-клуб. Рядом парк и детские площадки. Отличная транспортная доступность.',
                    'images' => [
                        '/assets/uploads/default-image/13-img.jpg',
                        '/assets/uploads/default-image/14-img.jpg'
                    ],
                    'hidden' => false
                ],
                
                // 8. Особенности
                [
                    'type' => 'features',
                    'title' => 'ОСОБЕННОСТИ',
                    'items' => [
                        ['text' => 'Панорамные окна'],
                        ['text' => 'Система "умный дом"'],
                        ['text' => 'Теплый пол'],
                        ['text' => 'Видеонаблюдение'],
                        ['text' => 'Консьерж-сервис'],
                        ['text' => 'Собственный сад']
                    ],
                    'images' => [
                        '/assets/uploads/default-image/15-img.jpg',
                        '/assets/uploads/default-image/16-img.jpg'
                    ],
                    'avatar' => '',
                    'hidden' => false
                ],
                
                // 9. Местоположение
                [
                    'type' => 'location',
                    'title' => 'МЕСТОПОЛОЖЕНИЕ',
                    'location_name' => 'ЖК "Успешная продажа"',
                    'location_address' => 'Москва',
                    'location_lat' => 55.755864,
                    'location_lng' => 37.617698,
                    'metro_stations' => [], // Добавляем поле для станций метро
                    'hidden' => false
                ],
                
                // 10. Контакты (будет заполнено данными из профиля, если доступны)
                [
                    'type' => 'contacts',
                    'contact_title' => 'Контакты',
                    'contact_name' => 'Presentation Realty',
                    'contact_role' => 'Конструктор презентаций',
                    'contact_phone' => '+7 (900) 000-00-00',
                    'contact_messengers' => 'Telegram | WhatsApp',
                    'images' => [
                        '/assets/uploads/default-image/17-img.jpg',
                        '/assets/uploads/default-image/18-img.jpg'
                    ],
                    'avatar' => '/assets/uploads/default-image/logo.jpg',
                    'hidden' => false
                ]
            ];
            
            // Заполняем слайд контактов данными из профиля, если они доступны
            $contactSlideIndex = count($defaultSlides) - 1; // Последний слайд - контакты
            if ($contactSlideIndex >= 0 && isset($defaultSlides[$contactSlideIndex]) && $defaultSlides[$contactSlideIndex]['type'] === 'contacts') {
                try {
                    $contactData = getProfileDataForPresentation($userId);
                    if ($contactData) {
                        if (!empty($contactData['avatar'])) {
                            $defaultSlides[$contactSlideIndex]['avatar'] = $contactData['avatar'];
                        }
                        if (!empty($contactData['name'])) {
                            $defaultSlides[$contactSlideIndex]['contact_name'] = $contactData['name'];
                        }
                        if (!empty($contactData['role'])) {
                            $defaultSlides[$contactSlideIndex]['contact_role'] = $contactData['role'];
                        }
                        if (!empty($contactData['phone'])) {
                            $defaultSlides[$contactSlideIndex]['contact_phone'] = $contactData['phone'];
                        }
                        if (!empty($contactData['messengers'])) {
                            $defaultSlides[$contactSlideIndex]['contact_messengers'] = $contactData['messengers'];
                        }
                    }
                } catch (Exception $e) {
                    // Игнорируем ошибки при загрузке данных профиля, используем заглушки
                    error_log("Error loading profile data for presentation: " . $e->getMessage());
                }
            }
            
            $id = $presentationModel->create([
                'user_id' => $userId,
                'title' => $title,
                'description' => $description,
                'slides_data' => ['slides' => $defaultSlides],
                'show_all_currencies' => 0
            ]);
            
            if ($id) {
                jsonResponse([
                    'success' => true,
                    'id' => $id,
                    'message' => 'Презентация создана со всеми типами слайдов'
                ]);
            } else {
                jsonResponse(['error' => 'Ошибка создания презентации'], 500);
            }
            break;
            
        case 'get_presentations':
            requireAuth();
            
            $limit = filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT) ?: 50;
            $offset = filter_input(INPUT_GET, 'offset', FILTER_VALIDATE_INT) ?: 0;
            
            $presentationModel = new Presentation();
            $presentations = $presentationModel->getByUser(null, $limit, $offset);
            $total = $presentationModel->countByUser();
            
            jsonResponse([
                'success' => true,
                'presentations' => $presentations,
                'total' => $total
            ]);
            break;
            
        case 'get_presentation':
            requireAuth();
            
            $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
            
            if (!$id) {
                jsonResponse(['error' => 'Неверный ID'], 400);
            }
            
            if (!canAccessPresentation($id)) {
                jsonResponse(['error' => 'Доступ запрещён'], 403);
            }
            
            $presentation = getPresentation($id);
            
            if (!$presentation) {
                jsonResponse(['error' => 'Презентация не найдена'], 404);
            }
            
            jsonResponse([
                'success' => true,
                'presentation' => $presentation
            ]);
            break;
            
        case 'update_presentation':
            requireAuth();
            
            if ($method !== 'POST') {
                jsonResponse(['error' => 'Метод не разрешён'], 405);
            }
            
            $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
            $title = trim($_POST['title'] ?? '');
            $slidesData = $_POST['slides_data'] ?? null;
            $csrfToken = $_POST['csrf_token'] ?? '';
            $themeColor = $_POST['theme_color'] ?? null;
            $themeStyle = $_POST['theme_style'] ?? null;
            $decorationShape = $_POST['decoration_shape'] ?? null;
            $showTopDecorations = filter_var($_POST['show_top_decorations'] ?? true, FILTER_VALIDATE_BOOLEAN);
            $showBottomDecorations = filter_var($_POST['show_bottom_decorations'] ?? true, FILTER_VALIDATE_BOOLEAN);
            $headingFontSize = $_POST['heading_font_size'] ?? null;
            $textFontSize = $_POST['text_font_size'] ?? null;
            $fontStyle = $_POST['font_style'] ?? null;
            $lineHeight = $_POST['line_height'] ?? null;
            $spacing = $_POST['spacing'] ?? null;
            $coverImage = $_POST['cover_image'] ?? null;
            $status = $_POST['status'] ?? 'draft';
            $showAllCurrencies = filter_var($_POST['show_all_currencies'] ?? false, FILTER_VALIDATE_BOOLEAN);
            
            if (!verifyCsrfToken($csrfToken)) {
                jsonResponse(['error' => 'Недействительный токен'], 403);
            }
            
            if (!$id) {
                jsonResponse(['error' => 'Неверный ID'], 400);
            }
            
            if (!canAccessPresentation($id)) {
                jsonResponse(['error' => 'Доступ запрещён'], 403);
            }
            
            $presentationModel = new Presentation();
            $updateData = [];
            
            if (!empty($title)) {
                $updateData['title'] = $title;
            }
            
            if ($themeColor && preg_match('/^#[0-9A-Fa-f]{6}$/', $themeColor)) {
                $updateData['theme_color'] = $themeColor;
            }
            
            if ($themeStyle && in_array($themeStyle, ['classic', 'modern', 'minimal', 'elegant'])) {
                $updateData['theme_style'] = $themeStyle;
            }
            
            if ($decorationShape && in_array($decorationShape, ['square', 'circle', 'rounded'])) {
                $updateData['decoration_shape'] = $decorationShape;
            }
            
            $updateData['show_top_decorations'] = $showTopDecorations ? 1 : 0;
            $updateData['show_bottom_decorations'] = $showBottomDecorations ? 1 : 0;
            
            if ($headingFontSize && in_array($headingFontSize, ['small', 'default', 'large'])) {
                $updateData['heading_font_size'] = $headingFontSize;
            }
            
            if ($textFontSize && in_array($textFontSize, ['small', 'default', 'large'])) {
                $updateData['text_font_size'] = $textFontSize;
            }
            
            if ($fontStyle && in_array($fontStyle, ['normal', 'bold', 'light'])) {
                $updateData['font_style'] = $fontStyle;
            }
            
            if ($lineHeight && in_array($lineHeight, ['tight', 'normal', 'loose'])) {
                $updateData['line_height'] = $lineHeight;
            }
            
            if ($spacing && in_array($spacing, ['compact', 'normal', 'spacious'])) {
                $updateData['spacing'] = $spacing;
            }
            
            if ($coverImage) {
                $updateData['cover_image'] = $coverImage;
            }
            
            $updateData['status'] = in_array($status, ['draft', 'published']) ? $status : 'draft';
            $updateData['last_autosave'] = date('Y-m-d H:i:s');
            $updateData['show_all_currencies'] = $showAllCurrencies ? 1 : 0;
            
            if ($slidesData) {
                $slides = json_decode($slidesData, true);
                
                if (json_last_error() !== JSON_ERROR_NONE) {
                    jsonResponse(['error' => 'Неверный формат данных слайдов: ' . json_last_error_msg()], 400);
                }
                
                foreach ($slides as &$slide) {
                    // Ограничение характеристик до 12 строк
                    if ($slide['type'] === 'characteristics' && isset($slide['items'])) {
                        $slide['items'] = array_slice($slide['items'], 0, 12);
                    }
                    
                    // Ограничение особенностей до 9 строк
                    if ($slide['type'] === 'features' && isset($slide['items'])) {
                        $slide['items'] = array_slice($slide['items'], 0, 9);
                    }
                    
                    // Обработка слайда местоположения - сохраняем координаты
                    if ($slide['type'] === 'location') {
                        // Валидация и сохранение координат
                        if (isset($slide['location_lat'])) {
                            $slide['location_lat'] = floatval($slide['location_lat']);
                        }
                        if (isset($slide['location_lng'])) {
                            $slide['location_lng'] = floatval($slide['location_lng']);
                        }
                        // Убедимся, что адрес сохраняется
                        if (isset($slide['location_address'])) {
                            $slide['location_address'] = trim($slide['location_address']);
                        }
                    }
                    
                    // Гарантируем корректные изображения для галереи (3 изображения)
                    if ($slide['type'] === 'gallery' && isset($slide['images'])) {
                        $slide['images'] = array_slice($slide['images'], 0, 3);
                        // Заполняем пустые слоты заглушками
                        for ($i = count($slide['images']); $i < 3; $i++) {
                            $slide['images'][$i] = 'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';
                        }
                    }
                    
                    // Гарантируем корректные изображения для сетки (4 изображения)
                    if ($slide['type'] === 'grid' && isset($slide['images'])) {
                        $slide['images'] = array_slice($slide['images'], 0, 4);
                        // Заполняем пустые слоты заглушками
                        for ($i = count($slide['images']); $i < 4; $i++) {
                            $slide['images'][$i] = 'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
                        }
                    }
                    
                    // Гарантируем корректные изображения для описания (2 изображения)
                    if ($slide['type'] === 'description' && isset($slide['images'])) {
                        $slide['images'] = array_slice($slide['images'], 0, 2);
                        // Заполняем пустые слоты заглушками
                        for ($i = count($slide['images']); $i < 2; $i++) {
                            $slide['images'][$i] = 'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';
                        }
                    }
                    
                    // Гарантируем корректные изображения для инфраструктуры (2 изображения)
                    if ($slide['type'] === 'infrastructure' && isset($slide['images'])) {
                        $slide['images'] = array_slice($slide['images'], 0, 2);
                        // Заполняем пустые слоты заглушками
                        for ($i = count($slide['images']); $i < 2; $i++) {
                            $slide['images'][$i] = 'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';
                        }
                    }
                    
                    // Гарантируем корректные изображения для особенностей (2 изображения + аватар)
                    if ($slide['type'] === 'features' && isset($slide['images'])) {
                        $slide['images'] = array_slice($slide['images'], 0, 2);
                        // Заполняем пустые слоты заглушками
                        for ($i = count($slide['images']); $i < 2; $i++) {
                            $slide['images'][$i] = 'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';
                        }
                        
                        // Заглушка для аватара
                        if (empty($slide['avatar'])) {
                            $slide['avatar'] = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                        }
                    }
                    
                    // Гарантируем корректные изображения для контактов (2 изображения + аватар)
                    if ($slide['type'] === 'contacts' && isset($slide['images'])) {
                        $slide['images'] = array_slice($slide['images'], 0, 2);
                        // Заполняем пустые слоты заглушками
                        for ($i = count($slide['images']); $i < 2; $i++) {
                            $slide['images'][$i] = 'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';
                        }
                        
                        // Заглушка для аватара
                        if (empty($slide['avatar'])) {
                            $slide['avatar'] = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                        }
                    }
                }
                
                $updateData['slides_data'] = ['slides' => $slides];
            }
            
            if (empty($updateData)) {
                jsonResponse(['error' => 'Нет данных для обновления'], 400);
            }
            
            $result = $presentationModel->update($id, $updateData);
            
            if ($result) {
                jsonResponse([
                    'success' => true,
                    'message' => $status === 'published' ? 'Презентация опубликована' : 'Изменения сохранены',
                    'status' => $status,
                    'cover_image' => $coverImage ?? null,
                    'theme_color' => $themeColor ?? '#2c7f8d',
                    'show_all_currencies' => $showAllCurrencies
                ]);
            } else {
                jsonResponse(['error' => 'Ошибка обновления презентации'], 500);
            }
            break;

        case 'generate_text':
            requireAuth();

            if ($method !== 'POST') {
                jsonResponse(['error' => 'Метод не разрешён'], 405);
            }

            $csrfToken = $_POST['csrf_token'] ?? '';
            if (!verifyCsrfToken($csrfToken)) {
                jsonResponse(['error' => 'Недействительный токен', 'success' => false], 403);
            }

            $type = trim($_POST['type'] ?? 'description');
            if (!in_array($type, ['description', 'infrastructure'], true)) {
                $type = 'description';
            }
            $prompt = trim($_POST['prompt'] ?? '');

            if (!file_exists(__DIR__ . '/../includes/gigachat.php')) {
                jsonResponse(['success' => false, 'error' => 'Сервис генерации текста не настроен']);
            }
            require_once __DIR__ . '/../includes/gigachat.php';

            $result = gigachat_generate_text($prompt, $type);

            if ($result['success'] && $result['text'] !== null) {
                jsonResponse(['success' => true, 'text' => $result['text']]);
            }
            jsonResponse([
                'success' => false,
                'error' => $result['error'] ?? 'Не удалось сгенерировать текст',
            ]);
            break;

        case 'suggest':
            $q = trim($_GET['q'] ?? $_GET['text'] ?? '');
            if ($q === '' || mb_strlen($q) < 2) {
                jsonResponse(['suggestions' => []]);
            }

            require_once __DIR__ . '/../includes/yandex-maps-helper.php';
            $yandexMaps = getYandexMapsHelper();
            $suggestions = $yandexMaps->suggestAddresses($q, 10);

            jsonResponse(['suggestions' => $suggestions]);
            break;

        case 'geocode':
            $address = trim($_GET['address'] ?? $_GET['q'] ?? '');
            if ($address === '') {
                jsonResponse(['success' => false, 'error' => 'Укажите адрес']);
            }
            require_once __DIR__ . '/../includes/yandex-maps-helper.php';
            $yandexMaps = getYandexMapsHelper();
            $point = $yandexMaps->geocode($address);
            if ($point) {
                jsonResponse(['success' => true, 'lat' => $point['lat'], 'lng' => $point['lon']]);
            }
            jsonResponse(['success' => false, 'error' => 'Адрес не найден']);
            break;

case 'find_nearest_metro':
    requireAuth();
    
    if ($method !== 'POST') {
        jsonResponse(['error' => 'Метод не разрешён'], 405);
    }
    
    $lat = filter_input(INPUT_POST, 'lat', FILTER_VALIDATE_FLOAT);
    $lng = filter_input(INPUT_POST, 'lng', FILTER_VALIDATE_FLOAT);
    $csrfToken = $_POST['csrf_token'] ?? '';
    
    if (!verifyCsrfToken($csrfToken)) {
        jsonResponse(['error' => 'Недействительный токен'], 403);
    }
    
    if (!$lat || !$lng) {
        jsonResponse(['error' => 'Неверные координаты'], 400);
    }
    
    require_once __DIR__ . '/../includes/yandex-maps-helper.php';
    $yandexMaps = getYandexMapsHelper();
    
    $stations = $yandexMaps->findNearestMetro($lat, $lng, 3);
    
    jsonResponse([
        'success' => true,
        'stations' => $stations
    ]);
    break;


        case 'delete_presentation':
            requireAuth();
            
            if ($method !== 'POST') {
                jsonResponse(['error' => 'Метод не разрешён'], 405);
            }
            
            $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
            $csrfToken = $_POST['csrf_token'] ?? '';
            
            if (!verifyCsrfToken($csrfToken)) {
                jsonResponse(['error' => 'Недействительный токен'], 403);
            }
            
            if (!$id) {
                jsonResponse(['error' => 'Неверный ID'], 400);
            }
            
            if (!canAccessPresentation($id)) {
                jsonResponse(['error' => 'Доступ запрещён'], 403);
            }
            
            $presentationModel = new Presentation();
            $result = $presentationModel->delete($id);
            
            if ($result) {
                jsonResponse([
                    'success' => true,
                    'message' => 'Презентация удалена'
                ]);
            } else {
                jsonResponse(['error' => 'Ошибка удаления презентации'], 500);
            }
            break;
            
        case 'toggle_publish':
            requireAuth();
            
            if ($method !== 'POST') {
                jsonResponse(['error' => 'Метод не разрешён'], 405);
            }
            
            $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
            $csrfToken = $_POST['csrf_token'] ?? '';
            
            if (!verifyCsrfToken($csrfToken)) {
                jsonResponse(['error' => 'Недействительный токен'], 403);
            }
            
            if (!$id || !canAccessPresentation($id)) {
                jsonResponse(['error' => 'Доступ запрещён'], 403);
            }
            
            $db = Database::getInstance()->getConnection();
            
            $stmt = $db->prepare("SELECT status FROM presentations WHERE id = ?");
            $stmt->execute([$id]);
            $current = $stmt->fetch();
            
            if (!$current) {
                jsonResponse(['error' => 'Презентация не найдена'], 404);
            }
            
            $newStatus = $current['status'] === 'published' ? 'draft' : 'published';
            
            $stmt = $db->prepare("UPDATE presentations SET status = ?, updated_at = NOW() WHERE id = ?");
            $result = $stmt->execute([$newStatus, $id]);
            
            if ($result) {
                jsonResponse([
                    'success' => true,
                    'status' => $newStatus,
                    'message' => $newStatus === 'published' ? 'Презентация опубликована' : 'Презентация снята с публикации'
                ]);
            } else {
                jsonResponse(['error' => 'Ошибка изменения статуса'], 500);
            }
            break;
            
        case 'duplicate_presentation':
            requireAuth();
            
            if ($method !== 'POST') {
                jsonResponse(['error' => 'Метод не разрешён'], 405);
            }
            
            $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
            $csrfToken = $_POST['csrf_token'] ?? '';
            
            if (!verifyCsrfToken($csrfToken)) {
                jsonResponse(['error' => 'Недействительный токен'], 403);
            }
            
            if (!$id || !canAccessPresentation($id)) {
                jsonResponse(['error' => 'Доступ запрещён'], 403);
            }
            
            $presentation = getPresentation($id);
            
            if (!$presentation) {
                jsonResponse(['error' => 'Презентация не найдена'], 404);
            }
            
            $presentationModel = new Presentation();
            $newId = $presentationModel->create([
                'user_id' => getCurrentUserId(),
                'title' => $presentation['title'] . ' (копия)',
                'description' => $presentation['description'],
                'slides_data' => json_encode(['slides' => $presentation['slides']]),
                'show_all_currencies' => $presentation['show_all_currencies'] ?? 0
            ]);
            
            if ($newId) {
                jsonResponse([
                    'success' => true,
                    'id' => $newId,
                    'message' => 'Презентация скопирована'
                ]);
            } else {
                jsonResponse(['error' => 'Ошибка копирования'], 500);
            }
            break;

        case 'generate_static_map':
            requireAuth();
            
            if ($method !== 'POST') {
                jsonResponse(['error' => 'Метод не разрешён'], 405);
            }
            
            $presentationId = filter_input(INPUT_POST, 'presentation_id', FILTER_VALIDATE_INT);
            $lat = filter_input(INPUT_POST, 'lat', FILTER_VALIDATE_FLOAT);
            $lng = filter_input(INPUT_POST, 'lng', FILTER_VALIDATE_FLOAT);
            $csrfToken = $_POST['csrf_token'] ?? '';
            
            if (!verifyCsrfToken($csrfToken)) {
                jsonResponse(['error' => 'Недействительный токен'], 403);
            }
            
            if (!$presentationId || !canAccessPresentation($presentationId)) {
                jsonResponse(['error' => 'Доступ запрещён'], 403);
            }
            
            if (!$lat || !$lng) {
                jsonResponse(['error' => 'Необходимо указать координаты'], 400);
            }
            
            // Создаем директорию для кеша карт
            $cacheDir = __DIR__ . '/../cache/maps/';
            if (!file_exists($cacheDir)) {
                mkdir($cacheDir, 0777, true);
            }
            
            // Генерируем имя файла на основе координат
            $mapFilename = 'map_' . md5($lat . '_' . $lng) . '.png';
            $mapPath = $cacheDir . $mapFilename;
            
            // Проверяем, есть ли уже закешированная карта
            if (!file_exists($mapPath)) {
                $yandexMaps = getYandexMapsHelper();
                $result = $yandexMaps->downloadStaticMap($lat, $lng, $mapPath, '800,600', 15);
                
                if (!$result) {
                    jsonResponse(['error' => 'Ошибка загрузки карты'], 500);
                }
            }
            
            // Возвращаем URL карты
            $mapUrl = '/cache/maps/' . $mapFilename;
            
            jsonResponse([
                'success' => true,
                'map_url' => $mapUrl,
                'filename' => $mapFilename
            ]);
            break;

        default:
            jsonResponse(['error' => 'Неизвестное действие презентации: ' . $action], 400);
    }
}
?>
