<?php
$slideTypeNames = [
    'cover' => 'Титульный слайд',
    'image' => 'Слайд на 1 фото',
    'characteristics' => 'Характеристики объекта',
    'gallery' => 'Слайд на 3 фото',
    'features' => 'Особенности',
    'grid' => 'Слайд на 4 фото',
    'description' => 'Описание',
    'infrastructure' => 'Инфраструктура',
    'location' => 'Местоположение',
    'contacts' => 'Контакты'
];
?>

<div class="mobile-editor">
    <!-- Шапка редактора для мобильной версии -->
    <div class="navbar navbar-expand-md editor-header-navbar mobile-header">
        <div class="container-xl">
            <!-- Название презентации -->
            <div class="navbar-brand d-flex align-items-center gap-2 flex-grow-1">
                <a href="/lk.php" class="btn btn-icon btn-ghost-secondary" title="Вернуться к списку">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                        <path d="M5 12l14 0" />
                        <path d="M5 12l6 -6" />
                        <path d="M5 12l6 6" />
                    </svg>
                </a>
                <input type="text" class="form-control title-input flex-grow-1" id="presentationTitle" value="<?php echo htmlspecialchars($presentation['title'] ?? ''); ?>" placeholder="Название презентации">
                <div class="auto-save-badge hidden" id="autoSaveIndicator">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-sm">
                        <path d="M9 12l2 2l4 -4" />
                        <path d="M21 12c-1 0 -3 -1 -3 -3s2 -3 3 -3s3 1 3 3s-2 3 -3 3" />
                        <path d="M3 12c1 0 3 -1 3 -3s-2 -3 -3 -3s-3 1 -3 3s2 3 3 3" />
                        <path d="M12 21c0 -1 -1 -3 -3 -3s-3 2 -3 3s1 3 3 3s3 -2 3 -3" />
                        <path d="M12 3c0 1 -1 3 -3 3s-3 -2 -3 -3s1 -3 3 -3s3 2 3 3" />
                    </svg>
                    <span class="d-none d-sm-inline">Сохранено</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Верхняя навигация слайдов -->
    <div class="mob-editor-nav">
        <div class="swiper-container" id="mobNavSwiper">
            <div class="swiper-wrapper" id="mobNavSwiperWrapper">
                <?php foreach ($slides as $index => $slide): ?>
                <div class="swiper-slide mob-editor-nav__slide" 
                     data-slide-index="<?php echo $index; ?>">
                    <button class="mob-editor-nav__arrow mob-editor-nav__arrow--left" 
                            onclick="event.stopPropagation(); moveSlideInNav(<?php echo $index; ?>, -1)" 
                            title="Переместить назад">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span class="mob-editor-nav__title" onclick="switchToSlide(<?php echo $index; ?>)">
                        <?php echo $slideTypeNames[$slide['type']] ?? 'Слайд ' . ($index + 1); ?>
                    </span>
                    <button class="mob-editor-nav__arrow mob-editor-nav__arrow--right" 
                            onclick="event.stopPropagation(); moveSlideInNav(<?php echo $index; ?>, 1)" 
                            title="Переместить вперед">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    <button class="mob-editor-nav__delete" 
                            onclick="event.stopPropagation(); deleteSlideInNav(<?php echo $index; ?>)" 
                            title="Удалить слайд">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

    <!-- Основной контейнер редактора -->
    <div class="mob-editor">
        <div class="swiper-container" id="mobEditorSwiper">
            <div class="swiper-wrapper" id="mobSwiperWrapper">
                <!-- Содержимое слайдов будет генерироваться JavaScript -->
            </div>
        </div>
    </div>

    <!-- Кнопки навигации между слайдами с выпадающим меню -->
    <div class="mob-editor-buttons">
        <button class="mob-editor-buttons__prev" onclick="prevSlide()">
            <i class="fas fa-chevron-left"></i>
            Назад
        </button>
        <button class="mob-editor-buttons__next" onclick="nextSlide()">
            Вперед
            <i class="fas fa-chevron-right"></i>
        </button>
        <button class="mob-editor-buttons__add" onclick="openAddSlideModal()" title="Добавить слайд">
            <i class="fas fa-plus"></i>
        </button>
        <button class="mob-editor-buttons__settings" onclick="toggleMobileSettings()" title="Настройки оформления">
            <i class="fas fa-cog"></i>
        </button>
    </div>

    <!-- Выпадающее меню управления -->
    <div class="mob-menu-dropdown" id="mobileMenuDropdown">
        <div class="mob-menu-dropdown__overlay" onclick="closeMobileMenu()"></div>
        <div class="mob-menu-dropdown__content">
            <div class="mob-menu-dropdown__header">
                <h3>Управление презентацией</h3>
                <button class="mob-menu-dropdown__close" onclick="closeMobileMenu()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="mob-menu-dropdown__items">
                <button class="mob-menu-item" onclick="openAddSlideModal()">
                    <i class="fas fa-plus-circle"></i>
                    <span>Добавить слайды</span>
                </button>
                <button class="mob-menu-item mob-menu-item--danger" onclick="deleteCurrentSlide()">
                    <i class="fas fa-trash-alt"></i>
                    <span>Удалить слайд</span>
                </button>
                <button class="mob-menu-item" onclick="moveSlideBackward()">
                    <i class="fas fa-arrow-left"></i>
                    <span>Переместить слайд назад</span>
                </button>
                <button class="mob-menu-item" onclick="moveSlideForward()">
                    <i class="fas fa-arrow-right"></i>
                    <span>Переместить слайд вперед</span>
                </button>
                <button class="mob-menu-item" onclick="openThemeColorPicker()">
                    <i class="fas fa-palette"></i>
                    <span>Цвет темы</span>
                </button>
                <button class="mob-menu-item mob-menu-item--warning" onclick="clearCurrentSlide()">
                    <i class="fas fa-eraser"></i>
                    <span>Очистить поля</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Модальное окно выбора типа слайда -->
    <div class="mob-add-slide-modal" id="mobAddSlideModal">
        <div class="mob-add-slide-modal__overlay" onclick="closeAddSlideModal()"></div>
        <div class="mob-add-slide-modal__content">
            <div class="mob-add-slide-modal__header">
                <h3>Выберите тип слайда</h3>
                <button class="mob-add-slide-modal__close" onclick="closeAddSlideModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="mob-add-slide-modal__types">
                <div class="slide-type-card" onclick="addSlideOfType('cover')">
                    <div class="slide-type-card__icon">📄</div>
                    <div class="slide-type-card__name">Титульный слайд</div>
                </div>
                <div class="slide-type-card" onclick="addSlideOfType('image')">
                    <div class="slide-type-card__icon">🖼️</div>
                    <div class="slide-type-card__name">Слайд на 1 фото</div>
                </div>
                <div class="slide-type-card" onclick="addSlideOfType('characteristics')">
                    <div class="slide-type-card__icon">📋</div>
                    <div class="slide-type-card__name">Характеристики</div>
                </div>
                <div class="slide-type-card" onclick="addSlideOfType('layout')">
                    <div class="slide-type-card__icon">📐</div>
                    <div class="slide-type-card__name">Планировка</div>
                </div>
                <div class="slide-type-card" onclick="addSlideOfType('gallery')">
                    <div class="slide-type-card__icon">🖼️</div>
                    <div class="slide-type-card__name">Слайд на 3 фото</div>
                </div>
                <div class="slide-type-card" onclick="addSlideOfType('features')">
                    <div class="slide-type-card__icon">⭐</div>
                    <div class="slide-type-card__name">Особенности</div>
                </div>
                <div class="slide-type-card" onclick="addSlideOfType('grid')">
                    <div class="slide-type-card__icon">🖼️</div>
                    <div class="slide-type-card__name">Слайд на 4 фото</div>
                </div>
                <div class="slide-type-card" onclick="addSlideOfType('description')">
                    <div class="slide-type-card__icon">📝</div>
                    <div class="slide-type-card__name">Описание</div>
                </div>
                <div class="slide-type-card" onclick="addSlideOfType('infrastructure')">
                    <div class="slide-type-card__icon">🏢</div>
                    <div class="slide-type-card__name">Инфраструктура</div>
                </div>
                <div class="slide-type-card" onclick="addSlideOfType('location')">
                    <div class="slide-type-card__icon">📍</div>
                    <div class="slide-type-card__name">Местоположение</div>
                </div>
                <div class="slide-type-card" onclick="addSlideOfType('contacts')">
                    <div class="slide-type-card__icon">📞</div>
                    <div class="slide-type-card__name">Контакты</div>
                </div>
            </div>
        </div>
    </div>

    <!-- В нижней панели исправляем вызовы функций -->
<div class="mob-editor-bottom">
    <div class="mob-editor-bottom__row">
        <div class="mob-editor-bottom__col">
            <a href="javascript:void(0)" onclick="previewMobilePresentation()" class="mob-editor-bottom__watch">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor"/>
                </svg>
                Просмотр
            </a>
        </div>
        <div class="mob-editor-bottom__col">
            <a href="javascript:void(0)" onclick="saveMobilePresentation()" class="mob-editor-bottom__watch">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3ZM12 19C10.34 19 9 17.66 9 16C9 14.34 10.34 13 12 13C13.66 13 15 14.34 15 16C15 17.66 13.66 19 12 19ZM15 9H5V5H15V9Z" fill="currentColor"/>
                </svg>
                Сохранить
            </a>
        </div>
        <div class="mob-editor-bottom__col">
            <a href="javascript:void(0)" 
               onclick="shareMobilePresentation()" 
               id="shareButton"
               data-is-public="<?php echo $isPublic ? '1' : '0'; ?>">
                <?php if ($isPublic): ?>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                </svg>
                Удалить ссылку
                <?php else: ?>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.35C15.11 18.56 15.08 18.78 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" fill="currentColor"/>
                </svg>
                Поделиться
                <?php endif; ?>
            </a>
        </div>
    </div>
</div>
</div>

<!-- Модальное окно для выбора типа сделки/валюты -->
<div class="mob-editor__choice" id="choiceModal">
<div class="mob-editor__list" id="choiceList"></div>
</div>

<!-- Модальное окно настроек оформления -->
<div class="mob-settings-modal" id="mobSettingsModal">
    <div class="mob-settings-modal__overlay" onclick="closeMobileSettings()"></div>
    <div class="mob-settings-modal__content">
        <div class="mob-settings-modal__header">
            <h3>Настройки оформления</h3>
            <button class="mob-settings-modal__close" onclick="closeMobileSettings()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="mob-settings-modal__body">
            <div class="mob-settings-group">
                <label class="form-label">Цвет темы</label>
                <input type="color" id="mobileThemeColorPicker" value="<?php echo $themeColor; ?>" class="form-control form-control-color mob-color-picker">
            </div>
            
            <div class="mob-settings-group">
                <label class="form-label">Стиль оформления</label>
                <div class="mob-theme-style-selector">
                    <button class="mob-theme-style-btn <?php echo ($presentation['theme_style'] ?? 'classic') === 'classic' ? 'active' : ''; ?>" data-theme="classic">
                        <i class="fas fa-square"></i> Классический
                    </button>
                    <button class="mob-theme-style-btn <?php echo ($presentation['theme_style'] ?? 'classic') === 'modern' ? 'active' : ''; ?>" data-theme="modern">
                        <i class="fas fa-circle"></i> Современный
                    </button>
                    <button class="mob-theme-style-btn <?php echo ($presentation['theme_style'] ?? 'classic') === 'minimal' ? 'active' : ''; ?>" data-theme="minimal">
                        <i class="fas fa-minus"></i> Минималистичный
                    </button>
                    <button class="mob-theme-style-btn <?php echo ($presentation['theme_style'] ?? 'classic') === 'elegant' ? 'active' : ''; ?>" data-theme="elegant">
                        <i class="fas fa-star"></i> Элегантный
                    </button>
                </div>
            </div>
            
            <div class="mob-settings-group">
                <label class="form-label">Форма декоративных элементов</label>
                <div class="mob-decoration-shape-selector">
                    <button class="mob-decoration-shape-btn <?php echo ($presentation['decoration_shape'] ?? 'square') === 'square' ? 'active' : ''; ?>" data-shape="square">
                        <i class="fas fa-square"></i> Квадрат
                    </button>
                    <button class="mob-decoration-shape-btn <?php echo ($presentation['decoration_shape'] ?? 'square') === 'circle' ? 'active' : ''; ?>" data-shape="circle">
                        <i class="fas fa-circle"></i> Круг
                    </button>
                    <button class="mob-decoration-shape-btn <?php echo ($presentation['decoration_shape'] ?? 'square') === 'rounded' ? 'active' : ''; ?>" data-shape="rounded">
                        <i class="fas fa-stop-circle"></i> Скругленный
                    </button>
                </div>
            </div>
            
            <div class="mob-settings-group">
                <label class="form-check">
                    <input type="checkbox" class="form-check-input" id="mobShowTopDecorations" <?php echo ($presentation['show_top_decorations'] ?? 1) ? 'checked' : ''; ?>>
                    <span class="form-check-label">Показывать верхние декоративные элементы</span>
                </label>
                <label class="form-check">
                    <input type="checkbox" class="form-check-input" id="mobShowBottomDecorations" <?php echo ($presentation['show_bottom_decorations'] ?? 1) ? 'checked' : ''; ?>>
                    <span class="form-check-label">Показывать нижние декоративные элементы</span>
                </label>
            </div>
            
            <div class="mob-settings-group">
                <label class="form-label">Размер шрифта заголовков</label>
                <select id="mobHeadingFontSize" class="form-select">
                    <option value="small" <?php echo ($presentation['heading_font_size'] ?? 'default') === 'small' ? 'selected' : ''; ?>>Маленький</option>
                    <option value="default" <?php echo ($presentation['heading_font_size'] ?? 'default') === 'default' ? 'selected' : ''; ?>>Обычный</option>
                    <option value="large" <?php echo ($presentation['heading_font_size'] ?? 'default') === 'large' ? 'selected' : ''; ?>>Большой</option>
                </select>
            </div>
            
            <div class="mob-settings-group">
                <label class="form-label">Размер шрифта текста</label>
                <select id="mobTextFontSize" class="form-select">
                    <option value="small" <?php echo ($presentation['text_font_size'] ?? 'default') === 'small' ? 'selected' : ''; ?>>Маленький</option>
                    <option value="default" <?php echo ($presentation['text_font_size'] ?? 'default') === 'default' ? 'selected' : ''; ?>>Обычный</option>
                    <option value="large" <?php echo ($presentation['text_font_size'] ?? 'default') === 'large' ? 'selected' : ''; ?>>Большой</option>
                </select>
            </div>
            
            <div class="mob-settings-group">
                <label class="form-label">Стиль шрифта</label>
                <select id="mobFontStyle" class="form-select">
                    <option value="normal" <?php echo ($presentation['font_style'] ?? 'normal') === 'normal' ? 'selected' : ''; ?>>Обычный</option>
                    <option value="bold" <?php echo ($presentation['font_style'] ?? 'normal') === 'bold' ? 'selected' : ''; ?>>Жирный</option>
                    <option value="light" <?php echo ($presentation['font_style'] ?? 'normal') === 'light' ? 'selected' : ''; ?>>Тонкий</option>
                </select>
            </div>
            
            <div class="mob-settings-group">
                <label class="form-label">Межстрочный интервал</label>
                <select id="mobLineHeight" class="form-select">
                    <option value="tight" <?php echo ($presentation['line_height'] ?? 'normal') === 'tight' ? 'selected' : ''; ?>>Плотный</option>
                    <option value="normal" <?php echo ($presentation['line_height'] ?? 'normal') === 'normal' ? 'selected' : ''; ?>>Обычный</option>
                    <option value="loose" <?php echo ($presentation['line_height'] ?? 'normal') === 'loose' ? 'selected' : ''; ?>>Свободный</option>
                </select>
            </div>
            
            <div class="mob-settings-group">
                <label class="form-label">Отступы между элементами</label>
                <select id="mobSpacing" class="form-select">
                    <option value="compact" <?php echo ($presentation['spacing'] ?? 'normal') === 'compact' ? 'selected' : ''; ?>>Компактные</option>
                    <option value="normal" <?php echo ($presentation['spacing'] ?? 'normal') === 'normal' ? 'selected' : ''; ?>>Обычные</option>
                    <option value="spacious" <?php echo ($presentation['spacing'] ?? 'normal') === 'spacious' ? 'selected' : ''; ?>>Просторные</option>
                </select>
            </div>
        </div>
    </div>
</div>