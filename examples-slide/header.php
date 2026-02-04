<?php
// Получаем права пользователя по тарифу
$permissions = getUserTariffPermissions();
$canPrint = $permissions['can_print'];
$canShare = $permissions['can_share'];
$canCreatePublicLink = $permissions['can_public_link'];
$remainingLinks = getRemainingPublicLinks();

// Проверяем, есть ли уже публичная ссылка
$publicUrl = $presentation['public_url'] ?? null;
$isPublic = $presentation['is_public'] ?? 0;
$publicHash = $presentation['public_hash'] ?? null;
?>
<div class="navbar navbar-expand-md editor-header-navbar">
    <div class="container-xl">
        <!-- Название презентации -->
        <div class="navbar-brand d-flex align-items-center gap-2">
            <a href="/lk.php" class="btn btn-icon btn-ghost-secondary" title="Вернуться к списку">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                    <path d="M5 12l14 0" />
                    <path d="M5 12l6 -6" />
                    <path d="M5 12l6 6" />
                </svg>
            </a>
            <input type="text" class="form-control title-input" id="presentationTitle" 
                value="<?php echo escape($presentation['title']); ?>" 
                placeholder="Название презентации">
            <div class="auto-save-badge hidden" id="autoSaveIndicator">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-sm">
                    <path d="M9 12l2 2l4 -4" />
                    <path d="M21 12c-1 0 -3 -1 -3 -3s2 -3 3 -3s3 1 3 3s-2 3 -3 3" />
                    <path d="M3 12c1 0 3 -1 3 -3s-2 -3 -3 -3s-3 1 -3 3s2 3 3 3" />
                    <path d="M12 21c0 -1 -1 -3 -3 -3s-3 2 -3 3s1 3 3 3s3 -2 3 -3" />
                    <path d="M12 3c0 1 -1 3 -3 3s-3 -2 -3 -3s1 -3 3 -3s3 2 3 3" />
                </svg>
                <span>Сохранено</span>
            </div>
            
            <div class="badge bg-success d-flex align-items-center gap-1" id="publicLinkBadge" style="<?php echo ($isPublic && $publicUrl) ? '' : 'display: none;'; ?>">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-sm">
                    <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
                    <path d="M3.6 9h16.8" />
                    <path d="M3.6 15h16.8" />
                    <path d="M11.5 3a17 17 0 0 0 0 18" />
                    <path d="M12.5 3a17 17 0 0 1 0 18" />
                </svg>
                <span>Публичная ссылка активна</span>
                <button class="btn btn-sm btn-icon btn-ghost-success" id="copyPublicLinkBtn" 
                    title="Копировать ссылку">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-sm">
                        <path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z" />
                        <path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" />
                    </svg>
                </button>
                <button class="btn btn-sm btn-icon btn-ghost-danger" id="disablePublicLinkBtn" 
                    title="Отключить публичную ссылку">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-sm">
                        <path d="M18 6l-12 12" />
                        <path d="M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
        
        <!-- Кнопка для мобильного меню -->
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#editor-navbar-menu" aria-controls="editor-navbar-menu" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        
        <!-- Меню навигации -->
        <div class="collapse navbar-collapse" id="editor-navbar-menu">
            <div class="navbar-nav ms-auto">
                <!-- Кнопка добавить слайд -->
                <div class="nav-item">
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addSlideModal">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler me-1">
                            <path d="M12 5l0 14" />
                            <path d="M5 12l14 0" />
                        </svg>
                        Добавить слайд
                    </button>
                </div>
                
                <!-- Действия (dropdown) -->
                <div class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown" data-bs-auto-close="outside" role="button" aria-expanded="false">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler me-1">
                            <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                            <path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                            <path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                        </svg>
                        Действия
                    </a>
                    <div class="dropdown-menu dropdown-menu-end">
                        <a class="dropdown-item" href="#" onclick="previewPresentation(); return false;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler me-2">
                                <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                                <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
                            </svg>
                            Просмотр
                        </a>
                        <a class="dropdown-item" href="#" onclick="savePresentation(false, 'published'); return false;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler me-2">
                                <path d="M19 21h-14a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h11l5 5v11a2 2 0 0 1 -2 2z" />
                                <path d="M17 21v-8h-2v8" />
                                <path d="M7 3v5h8" />
                            </svg>
                            Опубликовать
                        </a>
                        <?php if ($canShare): ?>
                        <a class="dropdown-item" href="#" onclick="sharePresentation(); return false;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler me-2">
                                <path d="M13 4v4c-6.575 1.028 -9.02 6.788 -10 12c4.49 -1.398 8.847 -1.736 13 -2v4l8 -5l-8 -5z" />
                            </svg>
                            Поделиться
                        </a>
                        <?php else: ?>
                        <a class="dropdown-item" href="#" onclick="showUpgradeModal(); return false;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler me-2">
                                <path d="M13 4v4c-6.575 1.028 -9.02 6.788 -10 12c4.49 -1.398 8.847 -1.736 13 -2v4l8 -5l-8 -5z" />
                            </svg>
                            Поделиться
                            <span class="badge bg-warning ms-2">PRO</span>
                        </a>
                        <?php endif; ?>
                    </div>
                </div>
                
                <!-- Настройки (offcanvas) -->
                <div class="nav-item">
                    <a class="nav-link" href="#" data-bs-toggle="offcanvas" data-bs-target="#editorSettingsOffcanvas" role="button" aria-controls="editorSettingsOffcanvas">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler me-1">
                            <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
                            <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                        </svg>
                        Настройки
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Offcanvas для настроек -->
<div class="offcanvas offcanvas-start offcanvas-narrow" tabindex="-1" id="editorSettingsOffcanvas" aria-labelledby="editorSettingsOffcanvasLabel">
    <div class="offcanvas-header">
        <h3 class="offcanvas-title" id="editorSettingsOffcanvasLabel">Настройки оформления</h3>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>
    <div class="offcanvas-body">
        <div class="editor-settings-content">
                                <div class="mb-3">
                                    <label for="themeColorPicker" class="form-label">Цвет темы</label>
                                    <input type="color" id="themeColorPicker" value="<?php echo $themeColor; ?>" 
                                        class="form-control form-control-color color-picker" title="Выберите цвет темы">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Стиль оформления</label>
                                    <div class="theme-style-selector">
                                        <button class="theme-style-btn <?php echo ($presentation['theme_style'] ?? 'classic') === 'classic' ? 'active' : ''; ?>" 
                                            data-theme="classic" title="Классический">
                                            <i class="fas fa-square"></i>
                                            <span>Классический</span>
                                        </button>
                                        <button class="theme-style-btn <?php echo ($presentation['theme_style'] ?? 'classic') === 'modern' ? 'active' : ''; ?>" 
                                            data-theme="modern" title="Современный">
                                            <i class="fas fa-circle"></i>
                                            <span>Современный</span>
                                        </button>
                                        <button class="theme-style-btn <?php echo ($presentation['theme_style'] ?? 'classic') === 'minimal' ? 'active' : ''; ?>" 
                                            data-theme="minimal" title="Минималистичный">
                                            <i class="fas fa-minus"></i>
                                            <span>Минималистичный</span>
                                        </button>
                                        <button class="theme-style-btn <?php echo ($presentation['theme_style'] ?? 'classic') === 'elegant' ? 'active' : ''; ?>" 
                                            data-theme="elegant" title="Элегантный">
                                            <i class="fas fa-star"></i>
                                            <span>Элегантный</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Форма декоративных элементов</label>
                                    <div class="decoration-shape-selector">
                                        <button class="decoration-shape-btn <?php echo ($presentation['decoration_shape'] ?? 'square') === 'square' ? 'active' : ''; ?>" 
                                            data-shape="square" title="Квадрат">
                                            <i class="fas fa-square"></i>
                                            <span>Квадрат</span>
                                        </button>
                                        <button class="decoration-shape-btn <?php echo ($presentation['decoration_shape'] ?? 'square') === 'circle' ? 'active' : ''; ?>" 
                                            data-shape="circle" title="Круг">
                                            <i class="fas fa-circle"></i>
                                            <span>Круг</span>
                                        </button>
                                        <button class="decoration-shape-btn <?php echo ($presentation['decoration_shape'] ?? 'square') === 'rounded' ? 'active' : ''; ?>" 
                                            data-shape="rounded" title="Скругленный">
                                            <i class="fas fa-stop-circle"></i>
                                            <span>Скругленный</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-check">
                                        <input type="checkbox" class="form-check-input" id="showTopDecorations" <?php echo ($presentation['show_top_decorations'] ?? 1) ? 'checked' : ''; ?>>
                                        <span class="form-check-label">Показывать верхние декоративные элементы</span>
                                    </label>
                                    <label class="form-check">
                                        <input type="checkbox" class="form-check-input" id="showBottomDecorations" <?php echo ($presentation['show_bottom_decorations'] ?? 1) ? 'checked' : ''; ?>>
                                        <span class="form-check-label">Показывать нижние декоративные элементы</span>
                                    </label>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Размер шрифта заголовков</label>
                                    <select id="headingFontSize" class="form-select">
                                        <option value="small" <?php echo ($presentation['heading_font_size'] ?? 'default') === 'small' ? 'selected' : ''; ?>>Маленький</option>
                                        <option value="default" <?php echo ($presentation['heading_font_size'] ?? 'default') === 'default' ? 'selected' : ''; ?>>Обычный</option>
                                        <option value="large" <?php echo ($presentation['heading_font_size'] ?? 'default') === 'large' ? 'selected' : ''; ?>>Большой</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Размер шрифта текста</label>
                                    <select id="textFontSize" class="form-select">
                                        <option value="small" <?php echo ($presentation['text_font_size'] ?? 'default') === 'small' ? 'selected' : ''; ?>>Маленький</option>
                                        <option value="default" <?php echo ($presentation['text_font_size'] ?? 'default') === 'default' ? 'selected' : ''; ?>>Обычный</option>
                                        <option value="large" <?php echo ($presentation['text_font_size'] ?? 'default') === 'large' ? 'selected' : ''; ?>>Большой</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Стиль шрифта</label>
                                    <select id="fontStyle" class="form-select">
                                        <option value="normal" <?php echo ($presentation['font_style'] ?? 'normal') === 'normal' ? 'selected' : ''; ?>>Обычный</option>
                                        <option value="bold" <?php echo ($presentation['font_style'] ?? 'normal') === 'bold' ? 'selected' : ''; ?>>Жирный</option>
                                        <option value="light" <?php echo ($presentation['font_style'] ?? 'normal') === 'light' ? 'selected' : ''; ?>>Тонкий</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Межстрочный интервал</label>
                                    <select id="lineHeight" class="form-select">
                                        <option value="tight" <?php echo ($presentation['line_height'] ?? 'normal') === 'tight' ? 'selected' : ''; ?>>Плотный</option>
                                        <option value="normal" <?php echo ($presentation['line_height'] ?? 'normal') === 'normal' ? 'selected' : ''; ?>>Обычный</option>
                                        <option value="loose" <?php echo ($presentation['line_height'] ?? 'normal') === 'loose' ? 'selected' : ''; ?>>Свободный</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Отступы между элементами</label>
                                    <select id="spacing" class="form-select">
                                        <option value="compact" <?php echo ($presentation['spacing'] ?? 'normal') === 'compact' ? 'selected' : ''; ?>>Компактные</option>
                                        <option value="normal" <?php echo ($presentation['spacing'] ?? 'normal') === 'normal' ? 'selected' : ''; ?>>Обычные</option>
                                        <option value="spacious" <?php echo ($presentation['spacing'] ?? 'normal') === 'spacious' ? 'selected' : ''; ?>>Просторные</option>
                                    </select>
                                </div>
                                
                                <hr class="my-3">
                                
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div class="text-muted small">Тариф</div>
                                        <div class="fw-bold"><?php echo $permissions['tariff_name']; ?></div>
                                    </div>
                                    <?php if (!$canPrint || !$canShare): ?>
                                    <button class="btn btn-warning btn-sm" onclick="showUpgradeModal()">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-sm me-1">
                                            <path d="M12 6l4 6l5 -4l-2 10h-14l-2 -10l5 4z" />
                                        </svg>
                                        Обновить
                                    </button>
                                    <?php endif; ?>
                                </div>
        </div>
    </div>
</div>

<script>
// Поделиться презентацией - упрощенная версия
function sharePresentation() {
    const presentationId = <?php echo $id; ?>;
    
    // Проверяем актуальное состояние публичной ссылки (синхронизация с мобильной версией)
    const isPublic = window.isPublic === true || window.isPublic === 'true';
    const publicUrl = window.publicUrl || '';
    
    // Если уже есть публичная ссылка - копируем её
    if (isPublic && publicUrl) {
        copyToClipboard(publicUrl);
        showNotification('Ссылка скопирована в буфер обмена');
        return;
    }
    
    // Если можем создавать ссылки - создаем и копируем
    <?php if ($canCreatePublicLink): ?>
    createAndCopyPublicLink(presentationId);
    <?php else: ?>
    showUpgradeModal();
    <?php endif; ?>
}

async function createAndCopyPublicLink(presentationId) {
    // Сначала сохраняем презентацию, если есть несохраненные изменения
    if (typeof hasUnsavedChanges !== 'undefined' && hasUnsavedChanges) {
        if (typeof savePresentation === 'function') {
            try {
                await savePresentation(true, 'published');
                // После сохранения создаем ссылку
                createPublicLinkAfterSave(presentationId);
            } catch (error) {
                showNotification('Сначала сохраните изменения', 'error');
            }
            return;
        }
    }
    
    createPublicLinkAfterSave(presentationId);
}

function createPublicLinkAfterSave(presentationId) {
    const formData = new FormData();
    formData.append('presentation_id', presentationId);
    formData.append('enable', '1');
    formData.append('csrf_token', '<?php echo generateCsrfToken(); ?>');
    
    fetch('/api.php?action=toggle_public_link', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.public_url) {
            copyToClipboard(data.public_url);
            showNotification('Публичная ссылка создана и скопирована');
            
            // Обновляем глобальные переменные
            window.isPublic = true;
            window.publicUrl = data.public_url;
            
            // Обновляем DOM без перезагрузки - показываем badge
            const badge = document.getElementById('publicLinkBadge');
            if (badge) {
                badge.style.display = '';
                badge.style.visibility = 'visible';
                badge.classList.remove('d-none');
                const copyBtn = document.getElementById('copyPublicLinkBtn');
                if (copyBtn) {
                    copyBtn.onclick = () => copyPublicLink(data.public_url);
                }
                const disableBtn = document.getElementById('disablePublicLinkBtn');
                if (disableBtn) {
                    disableBtn.onclick = () => disablePublicLink();
                }
            }
            
            // Синхронизируем с мобильной версией
            if (typeof window.syncMobileShareButton === 'function') {
                window.syncMobileShareButton(true, data.public_url);
            }
        } else {
            showNotification('Ошибка: ' + (data.error || 'Неизвестная ошибка'), 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Ошибка при выполнении запроса', 'error');
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
}

function copyPublicLink(url) {
    copyToClipboard(url);
    showNotification('Ссылка скопирована в буфер обмена');
}

function disablePublicLink() {
    if (!confirm('Вы уверены что хотите отключить публичную ссылку? Старая ссылка перестанет работать.')) {
        return;
    }
    
    const presentationId = <?php echo $id; ?>;
    const csrfToken = window.csrfToken || '<?php echo generateCsrfToken(); ?>';
    
    const formData = new FormData();
    formData.append('presentation_id', presentationId);
    formData.append('enable', '0');
    formData.append('csrf_token', csrfToken);
    
    fetch('/api.php?action=toggle_public_link', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Публичная ссылка отключена');
            
            // Обновляем глобальные переменные
            window.isPublic = false;
            window.publicUrl = '';
            
            // Обновляем DOM без перезагрузки - используем несколько способов для надежности
            const badge = document.getElementById('publicLinkBadge');
            if (badge) {
                badge.style.display = 'none';
                badge.style.visibility = 'hidden';
                badge.classList.add('d-none');
            }
            
            // Синхронизируем с мобильной версией
            if (typeof window.syncMobileShareButton === 'function') {
                window.syncMobileShareButton(false, '');
            }
        } else {
            showNotification('Ошибка: ' + (data.error || 'Неизвестная ошибка'), 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Ошибка отключения ссылки', 'error');
    });
}

// Функция синхронизации с мобильной версией (глобальная)
window.syncMobileShareButton = function(isPublic, publicUrl) {
    const shareButton = document.getElementById('shareButton');
    if (shareButton) {
        shareButton.setAttribute('data-is-public', isPublic ? '1' : '0');
        if (isPublic && publicUrl) {
            shareButton.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                </svg>
                Удалить ссылку
            `;
        } else {
            shareButton.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.35C15.11 18.56 15.08 18.78 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" fill="currentColor"/>
                </svg>
                Поделиться
            `;
        }
    }
}

// Функция синхронизации с ПК версией (вызывается из мобильной версии, глобальная)
window.syncDesktopShareButton = function(isPublic, publicUrl) {
    window.isPublic = isPublic;
    window.publicUrl = publicUrl || '';
    
    const badge = document.getElementById('publicLinkBadge');
    if (badge) {
        if (isPublic && publicUrl) {
            badge.style.display = '';
            badge.style.visibility = 'visible';
            badge.classList.remove('d-none');
            const copyBtn = document.getElementById('copyPublicLinkBtn');
            if (copyBtn) {
                copyBtn.onclick = () => copyPublicLink(publicUrl);
            }
        } else {
            badge.style.display = 'none';
            badge.style.visibility = 'hidden';
            badge.classList.add('d-none');
        }
    }
}

// Инициализация обработчиков для публичной ссылки
document.addEventListener('DOMContentLoaded', function() {
    const copyBtn = document.getElementById('copyPublicLinkBtn');
    const disableBtn = document.getElementById('disablePublicLinkBtn');
    const badge = document.getElementById('publicLinkBadge');
    
    // Проверяем актуальное состояние (может быть изменено в мобильной версии)
    const isPublic = window.isPublic === true || window.isPublic === 'true';
    const publicUrl = window.publicUrl || '';
    
    // Синхронизируем badge с актуальным состоянием
    if (badge) {
        if (isPublic && publicUrl) {
            badge.style.display = '';
            badge.style.visibility = 'visible';
            badge.classList.remove('d-none');
            if (copyBtn) {
                copyBtn.onclick = () => copyPublicLink(publicUrl);
            }
        } else {
            badge.style.display = 'none';
            badge.style.visibility = 'hidden';
            badge.classList.add('d-none');
        }
    }
    
    // Инициализируем обработчики кнопок
    if (copyBtn && isPublic && publicUrl) {
        copyBtn.onclick = () => copyPublicLink(publicUrl);
    }
    if (disableBtn) {
        disableBtn.onclick = () => disablePublicLink();
    }
});

function showNotification(message, type = 'success') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
}

function exportToPDF() {
    const presentationId = <?php echo $id; ?>;
    const url = `/api.php?action=export_pdf&id=${presentationId}`;
    
    fetch(url)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.open(data.print_url, '_blank');
        } else {
            showNotification('Ошибка: ' + (data.error || 'Неизвестная ошибка'), 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Ошибка при выполнении запроса', 'error');
    });
}

function showUpgradeModal() {
    const modal = document.createElement('div');
    modal.className = 'upgrade-modal';
    modal.innerHTML = `
        <div class="upgrade-modal-content">
            <div class="upgrade-modal-header">
                <h2><i class="fas fa-rocket"></i> Обновите тариф</h2>
                <p>Откройте новые возможности для ваших презентаций</p>
            </div>
            <div class="upgrade-modal-body">
                <p>Ваш текущий тариф "<?php echo $permissions['tariff_name']; ?>" имеет ограничения:</p>
                
                <div class="upgrade-features">
                    <?php if (!$canPrint): ?>
                    <div class="upgrade-feature">
                        <i class="fas fa-times-circle"></i>
                        <span>Экспорт в PDF недоступен</span>
                    </div>
                    <?php endif; ?>
                    
                    <?php if (!$canShare): ?>
                    <div class="upgrade-feature">
                        <i class="fas fa-times-circle"></i>
                        <span>Поделиться презентацией</span>
                    </div>
                    <?php endif; ?>
                    
                    <?php if (!$canCreatePublicLink): ?>
                    <div class="upgrade-feature">
                        <i class="fas fa-times-circle"></i>
                        <span>Публичные ссылки</span>
                    </div>
                    <?php endif; ?>
                </div>
                
                <p>Обновите тариф, чтобы получить доступ ко всем функциям!</p>
            </div>
            <div class="upgrade-modal-footer">
                <button class="btn btn-link link-secondary" onclick="this.closest('.upgrade-modal').remove()">
                    <i class="fas fa-times"></i> Закрыть
                </button>
                <button class="btn btn-primary" onclick="window.open('/tariffs.php', '_blank')">
                    <i class="fas fa-arrow-right"></i> Выбрать тариф
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function previewPresentation() {
    const presentationId = <?php echo $id; ?>;
    const url = `/api.php?action=generate_presentation&id=${presentationId}`;
    window.open(url, '_blank');
}
</script>
