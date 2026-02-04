<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';

if (!function_exists('getPresentationWithTheme')) {
    die('Функция getPresentationWithTheme не найдена');
}

spl_autoload_register(function ($class) {
    foreach ([__DIR__ . '/src/Models/', __DIR__ . '/src/Controllers/'] as $path) {
        $file = $path . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

session_start();
requireAuth();

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$id) redirect('/lk.php', 'Презентация не найдена', 'error');

if (!canAccessPresentation($id)) redirect('/lk.php', 'Доступ запрещён', 'error');

$presentation = getPresentationWithTheme($id);
if (!$presentation) redirect('/lk.php', 'Презентация не найдена', 'error');

$user = getCurrentUser();
$slides = $presentation['slides'] ?? [];
$themeColor = $presentation['theme_color'] ?? '#2c7f8d';
$showAllCurrencies = $presentation['show_all_currencies'] ?? false;
$publicUrl = $presentation['public_url'] ?? null;
$isPublic = $presentation['is_public'] ?? 0;
$publicHash = $presentation['public_hash'] ?? null;
$isMobile = isMobileDevice();

// Получаем настройки темы для пользователя
$themeSettings = [];
if ($user && class_exists('Database')) {
    try {
        $db = Database::getInstance()->getConnection();
        $themeStmt = $db->prepare("SELECT theme, theme_color_scheme, theme_font_family, theme_corner_radius FROM users WHERE id = ?");
        $themeStmt->execute([$user['id']]);
        $themeData = $themeStmt->fetch(PDO::FETCH_ASSOC);
        if ($themeData) {
            $themeSettings = [
                'theme' => $themeData['theme'] ?? 'light',
                'theme-color-scheme' => $themeData['theme_color_scheme'] ?? 'blue',
                'theme-font-family' => $themeData['theme_font_family'] ?? 'system',
                'theme-corner-radius' => $themeData['theme_corner_radius'] ?? 'md'
            ];
        }
    } catch (Exception $e) {
        // Игнорируем ошибки при получении настроек темы
    }
}
?>
<!DOCTYPE html>
<html lang="ru" 
      <?php 
      $themeValue = $themeSettings['theme'] ?? 'light';
      if ($themeValue === 'auto') {
        // Для auto определяем тему по времени суток на сервере
        $hour = (int)date('H');
        $timeBasedTheme = ($hour >= 6 && $hour < 20) ? 'light' : 'dark';
        echo 'data-bs-theme="' . escape($timeBasedTheme) . '" data-theme-auto="true"';
      } else {
        echo 'data-bs-theme="' . escape($themeValue) . '"';
      }
      ?>
      data-bs-theme-primary="<?php echo escape($themeSettings['theme-color-scheme'] ?? 'blue'); ?>"
      data-bs-theme-font="<?php 
        $fontFamily = $themeSettings['theme-font-family'] ?? 'system';
        echo escape($fontFamily === 'system' ? 'sans-serif' : 
             ($fontFamily === 'inter' ? 'sans-serif' :
             ($fontFamily === 'roboto' ? 'sans-serif' :
             ($fontFamily === 'open-sans' ? 'sans-serif' :
             ($fontFamily === 'lato' ? 'sans-serif' : 'sans-serif')))));
      ?>"
      data-bs-theme-radius="<?php 
        $cornerRadius = $themeSettings['theme-corner-radius'] ?? 'md';
        echo escape($cornerRadius === 'none' ? '0' : 
             ($cornerRadius === 'sm' ? '0.5' :
             ($cornerRadius === 'md' ? '1' :
             ($cornerRadius === 'lg' ? '1.5' :
             ($cornerRadius === 'xl' ? '2' : '1')))));
      ?>">
<head>
    <?php include __DIR__ . '/editor-data/head.php'; ?>
</head>
<body class="editor-page">
    <!-- BEGIN GLOBAL THEME SCRIPT -->
    <script src="<?php echo assetVersion('/dashboard/dist/js/tabler-theme.min.js'); ?>"></script>
    <!-- END GLOBAL THEME SCRIPT -->
    <div class="page">
        <!-- BEGIN NAVBAR -->
        <?php 
        // Передаем данные для уведомлений в header
        $userPayments = [];
        $remainingPresentations = '∞';
        $error = null;
        $success = null;
        require_once __DIR__ . '/includes/tabler-header.php';
        ?>
        <!-- END NAVBAR -->
        
        <div class="page-wrapper">
            <?php if ($isMobile): ?>
                <?php include __DIR__ . '/editor-data/mobile-editor.php'; ?>
            <?php else: ?>
                <?php include __DIR__ . '/editor-data/header.php'; ?>
                <?php include __DIR__ . '/editor-data/carousel.php'; ?>
                <?php include __DIR__ . '/editor-data/save-indicator.php'; ?>
                <?php include __DIR__ . '/editor-data/add-slide-modal.php'; ?>
            <?php endif; ?>
        </div>
    </div>
    
    <!-- BEGIN SCRIPTS -->
    <script src="<?php echo assetVersion('/dashboard/dist/js/tabler.min.js'); ?>" defer></script>
    <!-- END SCRIPTS -->
    
    <?php include __DIR__ . '/editor-data/scripts.php'; ?>
    
    <!-- Общие модальные окна -->
    <?php require_once __DIR__ . '/includes/tabler-common-modals.php'; ?>
    
    <!-- Общие скрипты для модальных окон и уведомлений -->
    <?php require_once __DIR__ . '/includes/tabler-common-scripts.php'; ?>
</body>
</html>