<!-- Подключение Яндекс.Карт -->
<script src="/assets/js/yandex-maps-integration.js?v=<?php echo time(); ?>"></script>

<script src="https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.js"></script>

<script>
    // Конфигурация и инициализация
    const presentationId = <?php echo $id; ?>;
    const csrfToken = '<?php echo generateCsrfToken(); ?>';
    let slides = <?php echo json_encode($slides); ?>;
    let swiper = null;
    let autoSaveTimer = null;
    let idleTimer = null;
    let currentThemeColor = '<?php echo $themeColor; ?>';
    let currentThemeStyle = '<?php echo $presentation['theme_style'] ?? 'classic'; ?>';
    let currentDecorationShape = '<?php echo $presentation['decoration_shape'] ?? 'square'; ?>';
    let showTopDecorations = <?php echo ($presentation['show_top_decorations'] ?? 1) ? 'true' : 'false'; ?>;
    let showBottomDecorations = <?php echo ($presentation['show_bottom_decorations'] ?? 1) ? 'true' : 'false'; ?>;
    let headingFontSize = '<?php echo $presentation['heading_font_size'] ?? 'default'; ?>';
    let textFontSize = '<?php echo $presentation['text_font_size'] ?? 'default'; ?>';
    let fontStyle = '<?php echo $presentation['font_style'] ?? 'normal'; ?>';
    let lineHeight = '<?php echo $presentation['line_height'] ?? 'normal'; ?>';
    let spacing = '<?php echo $presentation['spacing'] ?? 'normal'; ?>';
    let hasUnsavedChanges = false;
    let lastActivityTime = Date.now();
    const AUTOSAVE_DELAY = 30000; // Увеличили до 30 секунд, т.к. основное сохранение при переключении слайдов
    const IDLE_SAVE_DELAY = 300000;
    
    // Публичные данные для шеринга
    window.presentationId = presentationId;
    window.csrfToken = csrfToken;
    window.isPublic = <?php echo isset($isPublic) && $isPublic ? 'true' : 'false'; ?>;
    window.publicUrl = '<?php echo $publicUrl ?? ''; ?>';
    
    // Данные для валют
    let currencyRates = null;
    let currencySymbols = {
        'RUB': '₽',
        'USD': '$',
        'EUR': '€',
        'CNY': '¥',
        'KZT': '₸'
    };

    // Генераторы слайдов
    const slideGenerators = {};

    // Шаблоны слайдов по умолчанию
    const defaultSlides = {
        'cover': { 
            type: 'cover', 
            title: 'ЭКСКЛЮЗИВНОЕ<br>ПРЕДЛОЖЕНИЕ', 
            subtitle: 'АБСОЛЮТНО НОВЫЙ ТАУНХАУС<br>НА ПЕРВОЙ ЛИНИИ', 
            deal_type: 'Аренда', 
            currency: 'RUB',
            price_value: 1000000,
            price: '1 000 000 ₽ / месяц', 
            background_image: '',
            show_currencies: false,
            hidden: false 
        },
        'description': { 
            type: 'description', 
            title: 'ОПИСАНИЕ', 
            content: 'Подробно опишите о своем объекте...', 
            images: [], 
            hidden: false 
        },
        'infrastructure': { 
            type: 'infrastructure', 
            title: 'ИНФРАСТРУКТУРА', 
            content: 'Подробно опишите, что находится вблизи...', 
            images: [], 
            hidden: false 
        },
        'features': { 
            type: 'features', 
            title: 'ОСОБЕННОСТИ', 
            items: [{ text: 'ПАНОРАМНЫЙ ВИД' }], 
            images: [], 
            hidden: false 
        },
        'location': { 
            type: 'location', 
            title: 'МЕСТОПОЛОЖЕНИЕ', 
            location_name: 'ЖК "Новый"', 
            location_address: 'Москва', 
            location_lat: 55.755864,
            location_lng: 37.617698,
            hidden: false 
        },
        'contacts': { 
            type: 'contacts', 
            contact_title: 'Контакты', 
            contact_name: 'Имя Фамилия', 
            contact_role: 'Риелтор', 
            contact_phone: '+7 (900) 000-00-00', 
            contact_messengers: 'Telegram | WhatsApp', 
            images: [], 
            avatar: '', 
            hidden: false 
        },
        'image': { 
            type: 'image', 
            image: '', 
            hidden: false 
        },
        'gallery': { 
            type: 'gallery', 
            images: [], 
            hidden: false 
        },
        'grid': { 
            type: 'grid', 
            images: [], 
            hidden: false 
        },
        'characteristics': { 
            type: 'characteristics', 
            title: 'ХАРАКТЕРИСТИКИ', 
            items: [
                { label: 'Площадь квартиры:', value: '350 кв.м.' },
                { label: 'Количество комнат:', value: '5' }
            ], 
            image: '', 
            hidden: false 
        },
        'layout': { 
            type: 'layout', 
            title: 'ПЛАНИРОВКА', 
            image: '', 
            hidden: false 
        }
    };
    
    // Инициализация функций-генераторов
    function initSlideGenerators() {
        slideGenerators['cover'] = generateCoverSlide;
        slideGenerators['image'] = generateImageSlide;
        slideGenerators['gallery'] = generateGallerySlide;
        slideGenerators['characteristics'] = generateCharacteristicsSlide;
        slideGenerators['layout'] = generateLayoutSlide;
        slideGenerators['grid'] = generateGridSlide;
        slideGenerators['description'] = generateDescriptionSlide;
        slideGenerators['infrastructure'] = generateInfrastructureSlide;
        slideGenerators['features'] = generateFeaturesSlide;
        slideGenerators['location'] = generateLocationSlide;
        slideGenerators['contacts'] = generateContactsSlide;
    }

    // ===========================
    // БАЗОВЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С ДАННЫМИ
    // ===========================

    // Форматирование чисел с разделителями
    function formatNumber(num) {
        if (!num && num !== 0) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    // Парсинг отформатированного числа
    function parseFormattedNumber(str) {
        if (!str) return 0;
        return parseInt(str.replace(/\s/g, '')) || 0;
    }

    // Получение символа валюты
    function getCurrencySymbol(currency) {
        return currencySymbols[currency] || currency;
    }

    // Форматирование поля ввода цены
    function formatPriceInput(input) {
        let value = input.value.replace(/\s/g, '');
        value = value.replace(/\D/g, '');
        
        if (value) {
            input.value = formatNumber(parseInt(value));
        } else {
            input.value = '';
        }
    }

    // Обновление значения цены
    async function updatePriceValue(slideIndex, formattedValue) {
        const slide = slides[slideIndex];
        const rawValue = parseFormattedNumber(formattedValue);
        
        slide.price_value = rawValue;
        if (typeof updateCurrencyConversions === 'function') {
            await updateCurrencyConversions(slideIndex);
        }
        hasUnsavedChanges = true;
        triggerAutoSave();
    }

    // Триггер автосохранения (с задержкой для экономии запросов)
    function triggerAutoSave() {
        hasUnsavedChanges = true;
        clearTimeout(autoSaveTimer);
        
        // Для мобильной версии используем меньшую задержку
        const isMobile = window.innerWidth <= 767;
        const delay = isMobile ? 2000 : AUTOSAVE_DELAY; // 2 секунды для мобильной версии, 30 секунд для десктопа
        
        console.log('triggerAutoSave вызван, задержка:', delay, 'мс, мобильная:', isMobile);
        
        autoSaveTimer = setTimeout(() => {
            if (hasUnsavedChanges) {
                console.log('Автосохранение запущено...');
                savePresentation(true, 'draft');
            } else {
                console.log('Нет несохраненных изменений, автосохранение пропущено');
            }
        }, delay);
    }
    
    // Делаем функцию доступной глобально
    window.triggerAutoSave = triggerAutoSave;
    window.savePresentation = savePresentation;
    
    // Сохранение при переключении слайда (без задержки)
    function saveOnSlideChange() {
        if (hasUnsavedChanges) {
            clearTimeout(autoSaveTimer);
            savePresentation(true, 'draft');
        }
    }

    // Функция сохранения презентации
    async function savePresentation(isAuto = false, status = 'draft') {
        const btnSave = document.getElementById('btnSave');
        const isPublishing = status === 'published' && !isAuto;
        const isMobile = window.innerWidth <= 767;
        
        if (isPublishing && btnSave) {
            btnSave.disabled = true;
            btnSave.innerHTML = '<div class="spinner"></div> Публикация...';
        }
        
        // Показываем статус сохранения
        const saveIndicator = document.getElementById('saveIndicator');
        const autoSaveIndicator = document.getElementById('autoSaveIndicator');
        
        if (isMobile && autoSaveIndicator) {
            // Мобильная версия - обновляем индикатор автосохранения
            autoSaveIndicator.innerHTML = '<div class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></div> <span>Сохранение...</span>';
        } else if (saveIndicator) {
            // Десктопная версия
            saveIndicator.style.display = 'block';
            saveIndicator.className = 'save-indicator saving';
            const saveText = saveIndicator.querySelector('#saveText');
            if (saveText) {
                saveText.innerHTML = 'Сохранение...';
            }
        }
        
        // Форматируем цену для слайда обложки
        slides.forEach(slide => {
            if (slide.type === 'cover' && slide.price_value !== undefined) {
                const formatted = formatNumber(slide.price_value);
                const symbol = getCurrencySymbol(slide.currency || 'RUB');
                const isRent = slide.deal_type === 'Аренда';
                
                slide.price = formatted + ' ' + symbol + (isRent ? ' / месяц' : '');
            }
        });
        
        const formData = new FormData();
        formData.append('id', presentationId);
        
        // Получаем название презентации (мобильная или десктопная версия)
        const titleInput = document.getElementById('presentationTitle') || document.getElementById('mobilePresentationTitle');
        formData.append('title', titleInput?.value || window.presentationTitle || '');
        
        formData.append('slides_data', JSON.stringify(slides));
        formData.append('theme_color', currentThemeColor);
        formData.append('theme_style', currentThemeStyle);
        formData.append('decoration_shape', currentDecorationShape);
        formData.append('show_top_decorations', showTopDecorations ? '1' : '0');
        formData.append('show_bottom_decorations', showBottomDecorations ? '1' : '0');
        formData.append('heading_font_size', headingFontSize);
        formData.append('text_font_size', textFontSize);
        formData.append('font_style', fontStyle);
        formData.append('line_height', lineHeight);
        formData.append('spacing', spacing);
        formData.append('status', status);
        formData.append('csrf_token', csrfToken);
        
        // Для мобильной версии также проверяем чекбокс валют
        const showAllCurrenciesCheckbox = document.getElementById('showAllCurrencies');
        if (showAllCurrenciesCheckbox) {
            formData.append('show_all_currencies', showAllCurrenciesCheckbox.checked ? '1' : '0');
        }
        
        const coverSlide = slides.find(s => s.type === 'cover');
        if (coverSlide && coverSlide.background_image) {
            formData.append('cover_image', coverSlide.background_image);
        }
        
        try {
            const response = await fetch('/api.php?action=update_presentation', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                hasUnsavedChanges = false;
                
                // Показываем статус сохранено
                if (isMobile && autoSaveIndicator) {
                    // Мобильная версия
                    autoSaveIndicator.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-sm"><path d="M9 12l2 2l4 -4" /><path d="M21 12c-1 0 -3 -1 -3 -3s2 -3 3 -3s3 1 3 3s-2 3 -3 3" /><path d="M3 12c1 0 3 -1 3 -3s-2 -3 -3 -3s-3 1 -3 3s2 3 3 3" /><path d="M12 21c0 -1 -1 -3 -3 -3s-3 2 -3 3s1 3 3 3s3 -2 3 -3" /><path d="M12 3c0 1 -1 3 -3 3s-3 -2 -3 -3s1 -3 3 -3s3 2 3 3" /></svg><span>Сохранено</span>';
                    autoSaveIndicator.classList.remove('hidden');
                    // Автоматически скрываем через 3 секунды
                    setTimeout(() => {
                        if (autoSaveIndicator) {
                            autoSaveIndicator.classList.add('hidden');
                        }
                    }, 3000);
                } else if (saveIndicator) {
                    // Десктопная версия
                    saveIndicator.className = 'save-indicator saved';
                    const saveText = saveIndicator.querySelector('#saveText');
                    if (saveText) {
                        saveText.innerHTML = '<i class="fas fa-check"></i> Сохранено';
                    }
                    setTimeout(() => saveIndicator.style.display = 'none', 2500);
                }
                
                // Автоматически скрываем autoSaveIndicator для десктопной версии
                if (!isMobile && autoSaveIndicator) {
                    autoSaveIndicator.classList.remove('hidden');
                    setTimeout(() => {
                        if (autoSaveIndicator) {
                            autoSaveIndicator.classList.add('hidden');
                        }
                    }, 3000);
                }
                
                if (isPublishing) {
                    showNotification('Презентация успешно опубликована!', 'success');
                    if (btnSave) {
                        setTimeout(() => {
                            btnSave.disabled = false;
                            btnSave.innerHTML = '<i class="fas fa-save"></i> Опубликовать';
                        }, 500);
                    }
                } else if (!isAuto && isMobile) {
                    // Для мобильной версии показываем уведомление при ручном сохранении
                    if (typeof showMobileNotification === 'function') {
                        showMobileNotification('Сохранено успешно!', 'success');
                    }
                }
            } else {
                // Показываем ошибку
                if (isMobile && autoSaveIndicator) {
                    autoSaveIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span>Ошибка</span>';
                } else if (saveIndicator) {
                    saveIndicator.className = 'save-indicator error';
                    const saveText = saveIndicator.querySelector('#saveText');
                    if (saveText) {
                        saveText.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Ошибка';
                    }
                    setTimeout(() => saveIndicator.style.display = 'none', 3000);
                }
                
                if (!isAuto) {
                    const errorMsg = 'Ошибка сохранения: ' + (data.message || 'Unknown error');
                    if (isMobile && typeof showMobileNotification === 'function') {
                        showMobileNotification(errorMsg, 'error');
                    } else {
                        showNotification(errorMsg, 'error');
                    }
                    if (isPublishing && btnSave) {
                        btnSave.disabled = false;
                        btnSave.innerHTML = '<i class="fas fa-save"></i> Опубликовать';
                    }
                }
            }
        } catch (error) {
            console.error('Save error:', error);
            
            // Показываем ошибку
            if (isMobile && autoSaveIndicator) {
                autoSaveIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span>Ошибка</span>';
            } else if (saveIndicator) {
                saveIndicator.className = 'save-indicator error';
                const saveText = saveIndicator.querySelector('#saveText');
                if (saveText) {
                    saveText.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Ошибка';
                }
                setTimeout(() => saveIndicator.style.display = 'none', 3000);
            }
            
            if (!isAuto) {
                if (isMobile && typeof showMobileNotification === 'function') {
                    showMobileNotification('Ошибка соединения с сервером', 'error');
                } else {
                    showNotification('Ошибка соединения с сервером', 'error');
                }
                if (isPublishing && btnSave) {
                    btnSave.disabled = false;
                    btnSave.innerHTML = '<i class="fas fa-save"></i> Опубликовать';
                }
            }
        }
    }

    // Показ уведомления
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

    // Просмотр презентации
    function previewPresentation() {
        savePresentation(false, 'draft').then(() => {
            window.open(`/api.php?action=generate_presentation&id=${presentationId}`, '_blank');
        });
    }

    // Экспорт в PDF
    function exportToPDF() {
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

    // Копирование публичной ссылки
    function copyPublicLink(url) {
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Ссылка скопирована в буфер обмена!', 'success');
        });
    }

    // Добавление характеристики
    function addCharacteristic(slideIndex) {
        if (!slides[slideIndex].items) slides[slideIndex].items = [];
        
        if (slides[slideIndex].items.length >= 12) {
            showNotification('Максимальное количество характеристик - 12', 'error');
            return;
        }
        
        slides[slideIndex].items.push({ label: 'Название', value: 'Значение' });
        hasUnsavedChanges = true;
        triggerAutoSave();
        showNotification('Характеристика добавлена');
    }

    // Удаление характеристики
    function removeCharacteristic(slideIndex, itemIndex) {
        if (confirm('Удалить эту характеристику?')) {
            slides[slideIndex].items.splice(itemIndex, 1);
            hasUnsavedChanges = true;
            triggerAutoSave();
            showNotification('Характеристика удалена');
        }
    }

    // Добавление особенности
    function addFeature(slideIndex) {
        if (!slides[slideIndex].items) slides[slideIndex].items = [];
        
        if (slides[slideIndex].items.length >= 9) {
            showNotification('Максимальное количество особенностей - 9', 'error');
            return;
        }
        
        slides[slideIndex].items.push({ text: 'Новая особенность' });
        hasUnsavedChanges = true;
        triggerAutoSave();
        showNotification('Особенность добавлена');
    }

    // Удаление особенности
    function removeFeature(slideIndex, itemIndex) {
        if (confirm('Удалить эту особенность?')) {
            slides[slideIndex].items.splice(itemIndex, 1);
            hasUnsavedChanges = true;
            triggerAutoSave();
            showNotification('Особенность удалена');
        }
    }

    // Применение цвета темы
    function applyThemeColor(color) {
        currentThemeColor = color;
        
        // Применяем цвет ко всем элементам с классом theme-color
        document.querySelectorAll('.theme-color').forEach(el => {
            el.style.backgroundColor = color;
        });
        
        // Обновляем в данных презентации
        slides.forEach(slide => {
            if (slide.theme_color !== undefined) {
                slide.theme_color = color;
            }
        });
        
        hasUnsavedChanges = true;
    }

    // Применение стиля темы (глобальная функция)
    window.applyThemeStyle = function(style) {
        currentThemeStyle = style;
        
        // Удаляем все классы тем
        document.body.classList.remove('theme-classic', 'theme-modern', 'theme-minimal', 'theme-elegant');
        document.querySelectorAll('.booklet-page').forEach(page => {
            page.classList.remove('theme-classic', 'theme-modern', 'theme-minimal', 'theme-elegant');
        });
        
        // Добавляем новый класс темы
        document.body.classList.add('theme-' + style);
        document.querySelectorAll('.booklet-page').forEach(page => {
            page.classList.add('theme-' + style);
        });
        
        // Обновляем активную кнопку
        document.querySelectorAll('.theme-style-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === style) {
                btn.classList.add('active');
            }
        });
        
        hasUnsavedChanges = true;
        triggerAutoSave();
    };
    
    // Применение формы декоративных элементов
    function applyDecorationShape(shape) {
        currentDecorationShape = shape;
        
        // Удаляем все классы форм
        document.body.classList.remove('decoration-square', 'decoration-circle', 'decoration-rounded');
        document.querySelectorAll('.booklet-page').forEach(page => {
            page.classList.remove('decoration-square', 'decoration-circle', 'decoration-rounded');
        });
        
        // Добавляем новый класс формы
        document.body.classList.add('decoration-' + shape);
        document.querySelectorAll('.booklet-page').forEach(page => {
            page.classList.add('decoration-' + shape);
        });
        
        // Обновляем активную кнопку
        document.querySelectorAll('.decoration-shape-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.shape === shape) {
                btn.classList.add('active');
            }
        });
        
        hasUnsavedChanges = true;
        triggerAutoSave();
    }
    
    // Применение видимости декоративных элементов
    function applyDecorationVisibility() {
        const topSquares = document.querySelectorAll('[class*="__top-square"]');
        const bottomSquares = document.querySelectorAll('[class*="__bottom-square"]');
        
        topSquares.forEach(square => {
            square.style.display = showTopDecorations ? '' : 'none';
        });
        
        bottomSquares.forEach(square => {
            square.style.display = showBottomDecorations ? '' : 'none';
        });
    }
    
    // Применение дополнительных настроек кастомизации
    function applyCustomization() {
        // Удаляем все классы кастомизации
        document.body.classList.remove(
            'heading-small', 'heading-default', 'heading-large',
            'text-small', 'text-default', 'text-large',
            'font-normal', 'font-bold', 'font-light',
            'line-tight', 'line-normal', 'line-loose',
            'spacing-compact', 'spacing-normal', 'spacing-spacious'
        );
        
        // Добавляем новые классы
        document.body.classList.add(`heading-${headingFontSize}`);
        document.body.classList.add(`text-${textFontSize}`);
        document.body.classList.add(`font-${fontStyle}`);
        document.body.classList.add(`line-${lineHeight}`);
        document.body.classList.add(`spacing-${spacing}`);
        
        // Применяем ко всем слайдам
        document.querySelectorAll('.booklet-page').forEach(page => {
            page.classList.remove(
                'heading-small', 'heading-default', 'heading-large',
                'text-small', 'text-default', 'text-large',
                'font-normal', 'font-bold', 'font-light',
                'line-tight', 'line-normal', 'line-loose',
                'spacing-compact', 'spacing-normal', 'spacing-spacious'
            );
            page.classList.add(`heading-${headingFontSize}`);
            page.classList.add(`text-${textFontSize}`);
            page.classList.add(`font-${fontStyle}`);
            page.classList.add(`line-${lineHeight}`);
            page.classList.add(`spacing-${spacing}`);
        });
    }
    
    // Инициализация при загрузке DOM
    document.addEventListener('DOMContentLoaded', function() {
        // Применяем текущую тему при загрузке
        applyThemeStyle(currentThemeStyle);
        
        // Обработчик изменения цвета темы в реальном времени
        const themeColorPicker = document.getElementById('themeColorPicker');
        if (themeColorPicker) {
            themeColorPicker.addEventListener('input', function(e) {
                const color = e.target.value;
                applyThemeColor(color);
                triggerAutoSave();
            });
        }
        
        // Обработчики переключения стилей тем
        document.querySelectorAll('.theme-style-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const theme = this.dataset.theme;
                applyThemeStyle(theme);
            });
        });
        
        // Обработчики переключения форм декоративных элементов
        document.querySelectorAll('.decoration-shape-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const shape = this.dataset.shape;
                applyDecorationShape(shape);
            });
        });
        
        // Обработчики видимости декоративных элементов
        const showTopCheckbox = document.getElementById('showTopDecorations');
        const showBottomCheckbox = document.getElementById('showBottomDecorations');
        
        if (showTopCheckbox) {
            showTopCheckbox.addEventListener('change', function() {
                showTopDecorations = this.checked;
                applyDecorationVisibility();
                hasUnsavedChanges = true;
                triggerAutoSave();
            });
        }
        
        if (showBottomCheckbox) {
            showBottomCheckbox.addEventListener('change', function() {
                showBottomDecorations = this.checked;
                applyDecorationVisibility();
                hasUnsavedChanges = true;
                triggerAutoSave();
            });
        }
        
        // Применяем настройки при загрузке
        applyDecorationShape(currentDecorationShape);
        applyDecorationVisibility();
        applyCustomization();
        
        // Обработчики дополнительных настроек кастомизации
        const headingFontSizeSelect = document.getElementById('headingFontSize');
        const textFontSizeSelect = document.getElementById('textFontSize');
        const fontStyleSelect = document.getElementById('fontStyle');
        const lineHeightSelect = document.getElementById('lineHeight');
        const spacingSelect = document.getElementById('spacing');
        
        if (headingFontSizeSelect) {
            headingFontSizeSelect.addEventListener('change', function() {
                headingFontSize = this.value;
                applyCustomization();
                hasUnsavedChanges = true;
                triggerAutoSave();
            });
        }
        
        if (textFontSizeSelect) {
            textFontSizeSelect.addEventListener('change', function() {
                textFontSize = this.value;
                applyCustomization();
                hasUnsavedChanges = true;
                triggerAutoSave();
            });
        }
        
        if (fontStyleSelect) {
            fontStyleSelect.addEventListener('change', function() {
                fontStyle = this.value;
                applyCustomization();
                hasUnsavedChanges = true;
                triggerAutoSave();
            });
        }
        
        if (lineHeightSelect) {
            lineHeightSelect.addEventListener('change', function() {
                lineHeight = this.value;
                applyCustomization();
                hasUnsavedChanges = true;
                triggerAutoSave();
            });
        }
        
        if (spacingSelect) {
            spacingSelect.addEventListener('change', function() {
                spacing = this.value;
                applyCustomization();
                hasUnsavedChanges = true;
                triggerAutoSave();
            });
        }
        
        // Обработчик изменения названия
        const titleInput = document.getElementById('presentationTitle');
        if (titleInput) {
            titleInput.addEventListener('input', function() {
                hasUnsavedChanges = true;
                triggerAutoSave();
            });
        }
    });
</script>

<!-- Загружаем все необходимые скрипты -->
<?php if (isMobileDevice()): ?>
    <!-- Мобильная версия -->
    <script src="/editor-data/slide-management.js?v=<?php echo time(); ?>"></script>
    <script src="/editor-data/currency-functions.js?v=<?php echo time(); ?>"></script>
    <script src="/editor-data/mobile-menu-functions.js?v=<?php echo time(); ?>"></script>
    <script src="/editor-data/mobile-editor.js?v=<?php echo time(); ?>"></script>
<?php else: ?>
    <!-- Десктопная версия -->
    <script src="/editor-data/slide-generators.js?v=<?php echo time(); ?>"></script>
    <script src="/editor-data/editor-functions.js?v=<?php echo time(); ?>"></script>
    <script src="/editor-data/currency-functions.js?v=<?php echo time(); ?>"></script>
    <script src="/editor-data/slide-management.js?v=<?php echo time(); ?>"></script>
    <script src="/editor-data/init.js?v=<?php echo time(); ?>"></script>
<?php endif; ?>