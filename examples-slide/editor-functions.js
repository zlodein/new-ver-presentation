// Основные функции редактора

// Конвертация markdown в HTML
function markdownToHtml(markdown) {
    if (!markdown) return '';
    
    let html = markdown;
    
    // Жирный текст: **текст** -> <strong>текст</strong>
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Курсив: *текст* -> <em>текст</em> (только если не жирный)
    html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
    
    // Переносы строк: \n -> <br>
    html = html.replace(/\n/g, '<br>');
    
    // Сохраняем множественные пробелы (заменяем на &nbsp; для последовательных пробелов)
    // Но оставляем обычные пробелы для читаемости
    
    return html;
}

// Форматирование чисел с разделителями
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Парсинг отформатированного числа
function parseFormattedNumber(str) {
    return parseInt(str.replace(/\s/g, '')) || 0;
}

// Получение символа валюты
function getCurrencySymbol(currency) {
    return currencySymbols[currency] || currency;
}

// Триггер автосохранения (с задержкой для экономии запросов)
function triggerAutoSave() {
    hasUnsavedChanges = true;
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        if (hasUnsavedChanges) {
            savePresentation(true, 'draft');
        }
    }, AUTOSAVE_DELAY);
}

// Сохранение при переключении слайда (без задержки)
function saveOnSlideChange() {
    if (hasUnsavedChanges) {
        clearTimeout(autoSaveTimer);
        savePresentation(true, 'draft');
    }
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
    await updateCurrencyConversions(slideIndex);
    hasUnsavedChanges = true;
    triggerAutoSave();
}

// Обновление типа сделки (аренда/продажа)
async function updateDealType(slideIndex, dealType) {
    const slide = slides[slideIndex];
    slide.deal_type = dealType;
    
    const priceInput = document.querySelector(`[data-slide="${slideIndex}"][data-field="price_value"]`);
    if (priceInput) {
        priceInput.placeholder = dealType === 'Аренда' ? '0 000 000 / месяц' : '0 000 000';
    }
    
    await updateCurrencyConversions(slideIndex);
    hasUnsavedChanges = true;
    triggerAutoSave();
}

// Обновление валюты
async function updateCurrency(slideIndex, currency) {
    const slide = slides[slideIndex];
    const oldCurrency = slide.currency || 'RUB';
    slide.currency = currency;
    
    if (oldCurrency !== currency && slide.price_value) {
        await convertPrice(slideIndex, oldCurrency, currency);
    }
    
    await updateCurrencyConversions(slideIndex);
    hasUnsavedChanges = true;
    triggerAutoSave();
}

// Рендеринг всех слайдов
function renderSlides() {
    const wrapper = document.getElementById('swiperWrapper');
    if (!wrapper) return;
    
    // Применяем тему к body и всем слайдам
    const themeClass = typeof currentThemeStyle !== 'undefined' ? `theme-${currentThemeStyle}` : 'theme-classic';
    const decorationClass = typeof currentDecorationShape !== 'undefined' ? `decoration-${currentDecorationShape}` : 'decoration-square';
    const headingClass = typeof headingFontSize !== 'undefined' ? `heading-${headingFontSize}` : 'heading-default';
    const textClass = typeof textFontSize !== 'undefined' ? `text-${textFontSize}` : 'text-default';
    const fontClass = typeof fontStyle !== 'undefined' ? `font-${fontStyle}` : 'font-normal';
    const lineClass = typeof lineHeight !== 'undefined' ? `line-${lineHeight}` : 'line-normal';
    const spacingClass = typeof spacing !== 'undefined' ? `spacing-${spacing}` : 'spacing-normal';
    
    document.body.classList.remove('theme-classic', 'theme-modern', 'theme-minimal', 'theme-elegant');
    document.body.classList.remove('decoration-square', 'decoration-circle', 'decoration-rounded');
    document.body.classList.remove('heading-small', 'heading-default', 'heading-large');
    document.body.classList.remove('text-small', 'text-default', 'text-large');
    document.body.classList.remove('font-normal', 'font-bold', 'font-light');
    document.body.classList.remove('line-tight', 'line-normal', 'line-loose');
    document.body.classList.remove('spacing-compact', 'spacing-normal', 'spacing-spacious');
    
    document.body.classList.add(themeClass, decorationClass, headingClass, textClass, fontClass, lineClass, spacingClass);
    
    wrapper.innerHTML = '';
    slides.forEach((slide, index) => {
        const slideHtml = generateSlideHTML(slide, index);
        wrapper.insertAdjacentHTML('beforeend', slideHtml);
    });
    
    // Применяем тему ко всем слайдам после рендеринга
    setTimeout(() => {
        document.querySelectorAll('.booklet-page').forEach(page => {
            page.classList.remove('theme-classic', 'theme-modern', 'theme-minimal', 'theme-elegant');
            page.classList.remove('decoration-square', 'decoration-circle', 'decoration-rounded');
            page.classList.remove('heading-small', 'heading-default', 'heading-large');
            page.classList.remove('text-small', 'text-default', 'text-large');
            page.classList.remove('font-normal', 'font-bold', 'font-light');
            page.classList.remove('line-tight', 'line-normal', 'line-loose');
            page.classList.remove('spacing-compact', 'spacing-normal', 'spacing-spacious');
            
            page.classList.add(themeClass, decorationClass, headingClass, textClass, fontClass, lineClass, spacingClass);
        });
        
        attachSlideEvents();
        // Обновляем валюты для всех слайдов обложки
        slides.forEach((slide, index) => {
            if (slide.type === 'cover' && typeof updateCurrencyConversions === 'function') {
                updateCurrencyConversions(index);
            }
        });
    }, 100);
}

// Привязка событий к элементам слайдов
function attachSlideEvents() {
    // Обработка полей с contenteditable
    document.querySelectorAll('[contenteditable="true"][data-field]').forEach(field => {
        field.addEventListener('input', function() {
            const slideIndex = parseInt(this.dataset.slide);
            const fieldName = this.dataset.field;
            slides[slideIndex][fieldName] = this.innerHTML;
            hasUnsavedChanges = true;
            triggerAutoSave();
        });
        
        field.addEventListener('focus', function() {
            this.style.whiteSpace = 'pre-wrap';
        });
        
        field.addEventListener('blur', function() {
            this.innerHTML = this.innerHTML
                .replace(/ style="[^"]*"/g, '')
                .replace(/ class="[^"]*"/g, '')
                .replace(/<br\s*\/?>/g, '<br>')
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        });
    });
    
    // Обработка полей характеристик
    document.querySelectorAll('[data-char-field]').forEach(field => {
        field.addEventListener('input', function() {
            const slideIndex = parseInt(this.dataset.slide);
            const itemIndex = parseInt(this.dataset.item);
            const fieldName = this.dataset.charField;
            
            if (!slides[slideIndex].items) slides[slideIndex].items = [];
            if (!slides[slideIndex].items[itemIndex]) slides[slideIndex].items[itemIndex] = {};
            
            slides[slideIndex].items[itemIndex][fieldName] = this.textContent;
            hasUnsavedChanges = true;
            triggerAutoSave();
        });
        
        field.addEventListener('focus', function() {
            this.style.whiteSpace = 'pre-wrap';
        });
        
        field.addEventListener('blur', function() {
            this.textContent = this.textContent.trim();
        });
    });
    
    // Обработка полей особенностей
    document.querySelectorAll('[data-feature-field]').forEach(field => {
        field.addEventListener('input', function() {
            const slideIndex = parseInt(this.dataset.slide);
            const itemIndex = parseInt(this.dataset.item);
            const fieldName = this.dataset.featureField;
            
            if (!slides[slideIndex].items) slides[slideIndex].items = [];
            if (!slides[slideIndex].items[itemIndex]) slides[slideIndex].items[itemIndex] = {};
            
            slides[slideIndex].items[itemIndex][fieldName] = this.textContent;
            hasUnsavedChanges = true;
            triggerAutoSave();
        });
        
        field.addEventListener('focus', function() {
            this.style.whiteSpace = 'pre-wrap';
        });
        
        field.addEventListener('blur', function() {
            this.textContent = this.textContent.trim();
        });
    });
    
    // Обработка загрузки файлов
    document.querySelectorAll('input[type="file"]').forEach(input => {
        input.addEventListener('change', async function(e) {
            if (e.target.files && e.target.files[0]) {
                const result = await handleFileUpload(e.target.files[0], this);
                
                // ИСПРАВЛЕНИЕ: сбрасываем значение input после загрузки
                this.value = '';
                
                // Если загрузка успешна, обновляем слайд
                if (result && result.success) {
                    refreshSlide(result.slideIndex);
                }
            }
        });
    });
    
    // Обработка полей цены
    document.querySelectorAll('.price-input').forEach(input => {
        input.addEventListener('input', function() {
            formatPriceInput(this);
            
            // ИСПРАВЛЕНИЕ: обновляем валюты в реальном времени
            const slideIndex = parseInt(this.dataset.slide);
            updatePriceValue(slideIndex, this.value);
        });
        
        input.addEventListener('blur', function() {
            const slideIndex = parseInt(this.dataset.slide);
            updatePriceValue(slideIndex, this.value);
        });
    });
    
    // Обработка выбора типа сделки и валюты
    document.querySelectorAll('.deal-type-select, .currency-select').forEach(select => {
        select.addEventListener('change', function() {
            const slideIndex = parseInt(this.dataset.slide);
            const fieldName = this.dataset.field;
            const value = this.value;
            
            slides[slideIndex][fieldName] = value;
            
            if (fieldName === 'deal_type') {
                updateDealType(slideIndex, value);
            } else if (fieldName === 'currency') {
                updateCurrency(slideIndex, value);
            }
        });
    });
}

// Инициализация Swiper
function initSwiper() {
    renderSlides();
    
    try {
        swiper = new Swiper('#editorSwiper', {
            slidesPerView: 1,
            spaceBetween: 30,
            
            // Отключаем свайпы и тач-управление
            allowTouchMove: false,
            simulateTouch: false,
            noSwiping: true,
            noSwipingClass: 'swiper-slide',
            
            // Оставляем навигацию стрелками
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            
            // Пагинация (опционально, можно убрать если не нужна)
            pagination: {
                el: '.swiper-pagination',
                clickable: false, // делаем не кликабельной
            },
            
            // Дополнительные отключения
            mousewheel: false,    // отключаем прокрутку колесом
            keyboard: false,      // отключаем клавиши
            
            on: {
                slideChange: function() {
                    console.log('Переключение слайда, сохранение изменений...');
                    saveOnSlideChange();
                }
            }
        });
    } catch (error) {
        console.error('Failed to initialize Swiper:', error);
    }
}

// Добавление особенности
function addFeature(slideIndex) {
    if (!slides[slideIndex].items) slides[slideIndex].items = [];
    
    if (slides[slideIndex].items.length >= 9) {
        alert('Максимальное количество особенностей - 9');
        return;
    }
    
    slides[slideIndex].items.push({ text: 'Новая особенность' });
    refreshSlide(slideIndex);
    hasUnsavedChanges = true;
    triggerAutoSave();
}

// Удаление особенности
function removeFeature(slideIndex, itemIndex) {
    if (confirm('Удалить эту особенность?')) {
        slides[slideIndex].items.splice(itemIndex, 1);
        refreshSlide(slideIndex);
        hasUnsavedChanges = true;
        triggerAutoSave();
    }
}

// Добавление характеристики
function addCharacteristic(slideIndex) {
    if (!slides[slideIndex].items) slides[slideIndex].items = [];
    
    if (slides[slideIndex].items.length >= 12) {
        alert('Максимальное количество характеристик - 12');
        return;
    }
    
    slides[slideIndex].items.push({ label: 'Название', value: 'Значение' });
    refreshSlide(slideIndex);
    hasUnsavedChanges = true;
    triggerAutoSave();
}

// Удаление характеристики
function removeCharacteristic(slideIndex, itemIndex) {
    if (confirm('Удалить эту характеристику?')) {
        slides[slideIndex].items.splice(itemIndex, 1);
        refreshSlide(slideIndex);
        hasUnsavedChanges = true;
        triggerAutoSave();
    }
}

// Обновление слайда
function refreshSlide(index) {
    const slideElement = document.querySelector(`[data-slide-index="${index}"]`);
    if (slideElement && swiper) {
        const newHtml = generateSlideHTML(slides[index], index);
        const temp = document.createElement('div');
        temp.innerHTML = newHtml;
        
        slideElement.parentNode.replaceChild(temp.firstElementChild, slideElement);
        swiper.update();
        swiper.updateSlides();
        swiper.updateSlidesClasses();
        attachSlideEvents();
    }
}

// Генерация текста с помощью AI (GigaChat)
async function generateTextWithAI(slideIndex, type) {
    const slide = slides[slideIndex];
    if (!slide) {
        if (typeof showNotification === 'function') {
            showNotification('Слайд не найден', 'error');
        } else {
            alert('Слайд не найден');
        }
        return;
    }
    
    // Находим поле для текста
    const contentField = document.querySelector(`[data-slide="${slideIndex}"][data-field="content"]`);
    if (!contentField) {
        if (typeof showNotification === 'function') {
            showNotification('Поле для текста не найдено', 'error');
        } else {
            alert('Поле для текста не найдено');
        }
        return;
    }
    
    const originalContent = contentField.innerHTML || contentField.textContent || '';
    const btn = event?.target?.closest('.btn-generate-text');
    
    // Показываем индикатор загрузки
    const loadingText = 'Генерация текста с помощью AI...';
    contentField.textContent = loadingText;
    contentField.style.opacity = '0.5';
    contentField.style.pointerEvents = 'none';
    
    if (btn) {
        btn.classList.add('loading');
        btn.disabled = true;
    }
    
    // Создаем кнопку отмены
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-link link-secondary btn-cancel-generation';
    cancelBtn.innerHTML = '<i class="fas fa-times"></i> Отменить';
    cancelBtn.onclick = () => {
        contentField.innerHTML = originalContent;
        contentField.style.opacity = '1';
        contentField.style.pointerEvents = '';
        if (btn) {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
        cancelBtn.remove();
    };
    
    const wrapper = contentField.closest('.text-generator-wrapper') || contentField.parentElement;
    if (wrapper) {
        wrapper.appendChild(cancelBtn);
    }
    
    try {
        const formData = new FormData();
        formData.append('type', type);
        // Извлекаем текстовое содержимое для промпта (без HTML тегов)
        const textPrompt = contentField.textContent || originalContent.replace(/<[^>]*>/g, '') || '';
        formData.append('prompt', textPrompt);
        
        // Добавляем presentation_id если доступен
        const presentationId = (typeof window !== 'undefined' && window.presentationId) ? window.presentationId : '';
        if (presentationId) {
            formData.append('presentation_id', presentationId);
        }
        
        // Получаем CSRF токен (приоритет: локальная переменная -> window.csrfToken)
        const token = (typeof csrfToken !== 'undefined' && csrfToken) 
            ? csrfToken 
            : (typeof window !== 'undefined' && window.csrfToken) 
                ? window.csrfToken 
                : '';
        
        if (!token) {
            console.error('CSRF токен не найден!');
            if (typeof showNotification === 'function') {
                showNotification('Ошибка: CSRF токен не найден. Перезагрузите страницу.', 'error');
            }
            return;
        }
        
        formData.append('csrf_token', token);
        
        const response = await fetch('/api.php?action=generate_text', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        cancelBtn.remove();
        if (btn) {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
        contentField.style.opacity = '1';
        contentField.style.pointerEvents = '';
        
        if (data.success && data.text) {
            // Конвертируем markdown в HTML
            const htmlContent = markdownToHtml(data.text);
            contentField.innerHTML = htmlContent;
            // Обновляем данные слайда (сохраняем HTML)
            slide.content = htmlContent;
            if (typeof hasUnsavedChanges !== 'undefined') {
                hasUnsavedChanges = true;
            }
            if (typeof triggerAutoSave === 'function') {
                triggerAutoSave();
            }
            if (typeof showNotification === 'function') {
                showNotification('Текст успешно сгенерирован!', 'success');
            } else {
                alert('Текст успешно сгенерирован!');
            }
        } else {
            contentField.innerHTML = originalContent;
            const errorMsg = data.error || 'Неизвестная ошибка';
            
            // Если токен истек, предлагаем перезагрузить страницу
            if (errorMsg.includes('истек') || errorMsg.includes('токен')) {
                if (typeof showNotification === 'function') {
                    showNotification(errorMsg + ' Перезагрузите страницу.', 'error');
                } else {
                    alert(errorMsg + ' Перезагрузите страницу.');
                }
            } else {
                if (typeof showNotification === 'function') {
                    showNotification('Ошибка генерации: ' + errorMsg, 'error');
                } else {
                    alert('Ошибка генерации: ' + errorMsg);
                }
            }
        }
    } catch (error) {
        cancelBtn.remove();
        if (btn) {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
        contentField.innerHTML = originalContent;
        contentField.style.opacity = '1';
        contentField.style.pointerEvents = '';
        console.error('Ошибка генерации текста:', error);
        if (typeof showNotification === 'function') {
            showNotification('Ошибка соединения с сервером', 'error');
        } else {
            alert('Ошибка соединения с сервером');
        }
    }
}

// Делаем функцию доступной глобально
window.generateTextWithAI = generateTextWithAI;