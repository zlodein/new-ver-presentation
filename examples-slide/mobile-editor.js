// Мобильный редактор презентаций
let mobNavSwiper = null;
let mobEditorSwiper = null;
let currentSlideIndex = 0;

// Функция для отметки изменений и запуска автосохранения
function markAsModified() {
    console.log('markAsModified вызван');
    if (typeof hasUnsavedChanges !== 'undefined') {
        hasUnsavedChanges = true;
    }
    if (typeof triggerAutoSave === 'function') {
        console.log('Вызываю triggerAutoSave из markAsModified');
        triggerAutoSave();
    } else {
        console.warn('triggerAutoSave не определена!');
        // Прямое сохранение если функция недоступна
        if (typeof savePresentation === 'function') {
            console.log('Вызываю savePresentation напрямую');
            setTimeout(() => savePresentation(true, 'draft'), 2000);
        }
    }
}

// Синхронизация названия презентации
document.getElementById('mobilePresentationTitle')?.addEventListener('input', function(e) {
    window.presentationTitle = e.target.value;
    markAsModified();
});

// Также обрабатываем стандартное поле названия презентации
document.getElementById('presentationTitle')?.addEventListener('input', function(e) {
    window.presentationTitle = e.target.value;
    markAsModified();
});

// Синхронизация цвета темы
document.getElementById('mobileThemeColorPicker')?.addEventListener('change', function(e) {
    const newColor = e.target.value;
    document.documentElement.style.setProperty('--theme-main-color', newColor);
    window.currentThemeColor = newColor;
    markAsModified();
});

// Также обрабатываем стандартный селектор цвета темы
document.getElementById('themeColorPicker')?.addEventListener('change', function(e) {
    const newColor = e.target.value;
    document.documentElement.style.setProperty('--theme-main-color', newColor);
    window.currentThemeColor = newColor;
    markAsModified();
});

// Инициализация мобильного редактора
function initMobileEditor() {
    initMobileNavigation();
    initMobileEditorSwiper();
    renderMobileNavigation();
    renderMobileSlides();
    setupMobileEventListeners();
    updateButtons();
}

// Инициализация навигации слайдов
function initMobileNavigation() {
    mobNavSwiper = new Swiper('#mobNavSwiper', {
        slidesPerView: 'auto',
        spaceBetween: 20,
        freeMode: true,
        watchSlidesProgress: true,
        slideToClickedSlide: true
    });
}

// Инициализация основного слайдера
function initMobileEditorSwiper() {
    mobEditorSwiper = new Swiper('#mobEditorSwiper', {
        slidesPerView: 1,
        spaceBetween: 0,
        allowTouchMove: true,
        resistance: true,
        resistanceRatio: 0.85,
        touchRatio: 1,
        threshold: 5,
        followFinger: true,
        on: {
            slideChange: function() {
                currentSlideIndex = this.activeIndex;
                updateNavigation();
                updateButtons();
                // Сохраняем при переключении слайда, если есть несохраненные изменения
                if (typeof hasUnsavedChanges !== 'undefined' && hasUnsavedChanges) {
                    console.log('Мобильное переключение слайда, сохранение изменений...');
                    if (typeof saveOnSlideChange === 'function') {
                        saveOnSlideChange();
                    } else if (typeof savePresentation === 'function') {
                        // Fallback: прямое сохранение при переключении слайда
                        clearTimeout(autoSaveTimer);
                        savePresentation(true, 'draft');
                    } else if (typeof triggerAutoSave === 'function') {
                        // Если есть функция автосохранения, вызываем её
                        triggerAutoSave();
                    }
                }
            }
        }
    });
}

// Рендеринг мобильных слайдов
function renderMobileSlides() {
    const wrapper = document.getElementById('mobSwiperWrapper');
    wrapper.innerHTML = '';
    
    slides.forEach((slide, index) => {
        const slideHtml = generateMobileSlideHTML(slide, index);
        wrapper.insertAdjacentHTML('beforeend', slideHtml);
    });
    
    setTimeout(() => {
        // Устанавливаем значения для textarea с content напрямую через JavaScript
        // чтобы избежать экранирования HTML тегов в шаблонных строках
        slides.forEach((slide, index) => {
            if (slide.type === 'description' || slide.type === 'infrastructure') {
                const contentField = document.querySelector(`[data-slide="${index}"][data-field="content"]`);
                if (contentField && slide.content) {
                    const textForTextarea = htmlToTextForTextarea(slide.content);
                    contentField.value = textForTextarea;
                }
            }
        });
        
        setupMobileSlideEvents();
        // Загружаем курсы валют для конвертера
        if (typeof loadCurrencyRates === 'function') {
            loadCurrencyRates();
        }
        // Обновляем валюты для всех слайдов обложки
        slides.forEach((slide, index) => {
            if (slide.type === 'cover' && typeof updateCurrencyConversions === 'function') {
                updateCurrencyConversions(index);
            }
        });
        // Инициализируем карты для слайдов местоположения
        if (typeof initAllMobileLocationMaps === 'function') {
            initAllMobileLocationMaps();
        }
        // Обновляем Swiper после рендеринга
        if (mobEditorSwiper) {
            mobEditorSwiper.update();
        }
    }, 100);
}

// Подсчет количества изображений в слайде
function countImagesInSlide(slide) {
    if (!slide) return 0;
    
    let count = 0;
    
    switch (slide.type) {
        case 'cover':
            if (slide.background_image) count = 1;
            break;
        case 'image':
            if (slide.image) count = 1;
            break;
        case 'characteristics':
            if (slide.image) count = 1;
            break;
        case 'gallery':
        case 'grid':
            if (slide.images && Array.isArray(slide.images)) {
                count = slide.images.filter(img => img && (img.url || img)).length;
            }
            break;
        case 'description':
        case 'infrastructure':
        case 'features':
            if (slide.images && Array.isArray(slide.images)) {
                count = slide.images.filter(img => img && (img.url || img)).length;
            }
            break;
    }
    
    return count;
}

// Получение класса для количества изображений
function getImageCountClass(count) {
    if (count === 1) return 'one-image';
    if (count === 2) return 'two-images';
    if (count === 3) return 'three-images';
    if (count === 4) return 'four-images';
    return '';
}

// Генерация кнопок управления слайдом
function generateSlideControlButtons(slideIndex) {
    const canMoveUp = slideIndex > 0;
    const canMoveDown = slideIndex < slides.length - 1;
    const canDelete = slides.length > 1;
    const isHidden = slides[slideIndex]?.hidden || false;
    
    return `
        <div class="mob-editor__slide-controls">
            <button class="mob-editor__control-btn mob-editor__control-btn--hide ${isHidden ? 'active' : ''}" 
                    onclick="toggleSlideVisibilityMobile(${slideIndex})" 
                    title="${isHidden ? 'Показать слайд' : 'Скрыть слайд'}">
                <i class="fas fa-eye${isHidden ? '-slash' : ''}"></i>
            </button>
            <div style="display: flex; gap: 8px; margin-left: auto;">
                ${canMoveUp ? `
                    <button class="mob-editor__control-btn mob-editor__control-btn--up" 
                            onclick="moveSlideInNav(${slideIndex}, -1)" 
                            title="Переместить вверх">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                ` : ''}
                ${canMoveDown ? `
                    <button class="mob-editor__control-btn mob-editor__control-btn--down" 
                            onclick="moveSlideInNav(${slideIndex}, 1)" 
                            title="Переместить вниз">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                ` : ''}
                ${canDelete ? `
                    <button class="mob-editor__control-btn mob-editor__control-btn--delete" 
                            onclick="deleteSlideInNav(${slideIndex})" 
                            title="Удалить слайд">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Генерация HTML для мобильного слайда
function generateMobileSlideHTML(slide, index) {
    const imageCount = countImagesInSlide(slide);
    const imageClass = getImageCountClass(imageCount);
    const slideClass = `swiper-slide mob-editor__slide${imageClass ? ' ' + imageClass : ''}`;
    
    let html = '';
    switch (slide.type) {
        case 'cover':
            html = generateMobileCoverSlide(slide, index);
            break;
        case 'image':
            html = generateMobileImageSlide(slide, index);
            break;
        case 'characteristics':
            html = generateMobileCharacteristicsSlide(slide, index);
            break;
        case 'layout':
            html = generateMobileLayoutSlide(slide, index);
            break;
        case 'gallery':
            html = generateMobileGallerySlide(slide, index);
            break;
        case 'features':
            html = generateMobileFeaturesSlide(slide, index);
            break;
        case 'grid':
            html = generateMobileGridSlide(slide, index);
            break;
        case 'description':
            html = generateMobileDescriptionSlide(slide, index);
            break;
        case 'infrastructure':
            html = generateMobileInfrastructureSlide(slide, index);
            break;
        case 'location':
            html = generateMobileLocationSlide(slide, index);
            break;
        case 'contacts':
            html = generateMobileContactsSlide(slide, index);
            break;
        default:
            return `<div class="${slideClass}">Неизвестный тип слайда: ${slide.type}</div>`;
    }
    
    // Заменяем класс mob-editor__slide на класс с учетом количества изображений
    if (html.includes('mob-editor__slide')) {
        // Заменяем все варианты класса
        html = html.replace(/class="swiper-slide mob-editor__slide"/g, `class="${slideClass}"`);
        html = html.replace(/class="swiper-slide mob-editor__slide /g, `class="${slideClass} `);
        html = html.replace(/class="swiper-slide mob-editor__slide"/g, `class="${slideClass}"`);
    }
    
    // Добавляем кнопки управления в начало содержимого слайда (после открывающего тега div)
    const controls = generateSlideControlButtons(index);
    html = html.replace(/(<div class="[^"]*mob-editor__slide[^"]*">)/, '$1' + controls);
    
    return html;
}

// Генерация слайда "Обложка" для мобильной версии
function generateMobileCoverSlide(slide, index) {
    const dealType = slide.deal_type || 'Аренда';
    const currency = slide.currency || 'RUB';
    const priceValue = slide.price_value || 1000000;
    const formattedPrice = formatNumber(priceValue);
    
    // Убираем <br> из текста для textarea
    const title = (slide.title || '').replace(/<br\s*\/?>/gi, '\n');
    const subtitle = (slide.subtitle || '').replace(/<br\s*\/?>/gi, '\n');
    
    return `
        <div class="swiper-slide mob-editor__slide">
            <div class="mob-editor__block">
                <label class="mob-editor__label">Заголовок</label>
                <textarea class="mob-editor__textarea" 
                          data-slide="${index}" 
                          data-field="title"
                          placeholder="ЭКСКЛЮЗИВНОЕ ПРЕДЛОЖЕНИЕ">${title}</textarea>
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">Подзаголовок</label>
                <textarea class="mob-editor__textarea" 
                          data-slide="${index}" 
                          data-field="subtitle"
                          placeholder="АБСОЛЮТНО НОВЫЙ ТАУНХАУС НА ПЕРВОЙ ЛИНИИ">${subtitle}</textarea>
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">Фоновое изображение</label>
                <div class="mob-editor__images">
                    ${slide.background_image ? `
                        <div class="mob-editor__image">
                            <img src="${slide.background_image}" alt="Фон">
                            <div class="mob-editor__image-remove" onclick="removeMobileImage(${index}, 'background_image')">×</div>
                        </div>
                    ` : `
                        <div class="mob-editor__image add-image" onclick="uploadMobileImage(${index}, 'background')">
                        </div>
                    `}
                </div>
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">Цена</label>
                <div class="price-mobile-input">
                    <input type="text" 
                           class="price-mobile-input__field"
                           value="${formattedPrice}"
                           data-slide="${index}"
                           data-field="price_value"
                           oninput="formatPriceInput(this); updateMobilePrice(${index}, this.value)">
                    <div class="price-mobile-input__type" onclick="showChoiceModal(${index}, 'deal_type')">
                        ${dealType === 'Аренда' ? 'Аренда' : 'Продажа'}
                    </div>
                    <div class="price-mobile-input__currency" onclick="showChoiceModal(${index}, 'currency')">
                        ${getCurrencySymbol(currency)}
                    </div>
                </div>
                
                <!-- Все валюты (отображаются по умолчанию) -->
                <div id="mobile-all-currencies-${index}" class="mobile-currency-converter" style="margin-top: 10px;">
                    <!-- Валюты будут загружены через updateCurrencyConversions -->
                </div>
                
                <!-- Чекбокс для отображения валют в презентации -->
                <div style="margin-top: 10px;">
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #555; cursor: pointer; padding: 8px 12px; background: #f8f9fa; border-radius: 6px; border: 1px solid #e0e0e0;">
                        <input type="checkbox" 
                               id="mobile-show-currencies-${index}"
                               data-slide="${index}"
                               ${slide.show_currencies ? 'checked' : ''}
                               onchange="toggleCurrenciesVisibilityMobile(${index})"
                               style="cursor: pointer; width: 16px; height: 16px;">
                        <span>Выводить валюты в презентации</span>
                    </label>
                </div>
            </div>
        </div>
    `;
}

// Генерация слайда "Изображение" для мобильной версии
function generateMobileImageSlide(slide, index) {
    return `
        <div class="swiper-slide mob-editor__slide">
            <div class="mob-editor__block">
                <label class="mob-editor__label">Основное изображение</label>
                <div class="mob-editor__images">
                    ${slide.image ? `
                        <div class="mob-editor__image">
                            <img src="${slide.image}" alt="Изображение">
                            <div class="mob-editor__image-remove" onclick="removeMobileImage(${index}, 'image')">×</div>
                        </div>
                    ` : `
                        <div class="mob-editor__image add-image" onclick="uploadMobileImage(${index}, 'single')">
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
}

// Генерация слайда "Характеристики" для мобильной версии
function generateMobileCharacteristicsSlide(slide, index) {
    const items = slide.items || [];
    
    return `
        <div class="swiper-slide mob-editor__slide">
            <div class="mob-editor__block">
                <label class="mob-editor__label">Заголовок</label>
                <input type="text" 
                       class="mob-editor__input"
                       data-slide="${index}"
                       data-field="title"
                       value="${slide.title || 'ХАРАКТЕРИСТИКИ'}"
                       placeholder="ХАРАКТЕРИСТИКИ">
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">Изображение</label>
                <div class="mob-editor__images">
                    ${slide.image ? `
                        <div class="mob-editor__image">
                            <img src="${slide.image}" alt="Характеристики">
                            <div class="mob-editor__image-remove" onclick="removeMobileImage(${index}, 'image')">×</div>
                        </div>
                    ` : `
                        <div class="mob-editor__image add-image" onclick="uploadMobileImage(${index}, 'char-image')">
                        </div>
                    `}
                </div>
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">Характеристики (макс. 12)</label>
                ${items.map((item, i) => `
                    <div class="mob-editor__param">
                        <input type="text" 
                               placeholder="Название"
                               data-slide="${index}"
                               data-item="${i}"
                               data-field="label"
                               value="${item.label || ''}">
                        <input type="text" 
                               placeholder="Значение"
                               data-slide="${index}"
                               data-item="${i}"
                               data-field="value"
                               value="${item.value || ''}">
                        <button class="mob-editor__param-remove" onclick="removeCharacteristic(${index}, ${i})">×</button>
                    </div>
                `).join('')}
                
                ${items.length < 12 ? `
                    <button class="mob-editor__add-param" onclick="addCharacteristic(${index})">
                        + Добавить характеристику
                    </button>
                ` : '<div class="limit-warning">Достигнут лимит 12 характеристик</div>'}
            </div>
        </div>
    `;
}

// Генерация слайда "Планировка" для мобильной версии
function generateMobileLayoutSlide(slide, index) {
    return `
        <div class="swiper-slide mob-editor__slide">
            <div class="mob-editor__block">
                <label class="mob-editor__label">Заголовок</label>
                <input type="text" 
                       class="mob-editor__input"
                       data-slide="${index}"
                       data-field="title"
                       value="${slide.title || 'ПЛАНИРОВКА'}"
                       placeholder="ПЛАНИРОВКА">
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">Изображение</label>
                <div class="mob-editor__images">
                    ${slide.image ? `
                        <div class="mob-editor__image">
                            <img src="${slide.image}" alt="Планировка">
                            <div class="mob-editor__image-remove" onclick="removeMobileImage(${index}, 'image')">×</div>
                        </div>
                    ` : `
                        <div class="mob-editor__image add-image" onclick="uploadMobileImage(${index}, 'layout-image')">
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
}

// Генерация слайда "Галерея" для мобильной версии
function generateMobileGallerySlide(slide, index) {
    const images = slide.images || [];
    
    return `
        <div class="swiper-slide mob-editor__slide">
            <div class="mob-editor__block">
                <label class="mob-editor__label">Галерея (3 изображения)</label>
                <div class="mob-editor__images">
                    ${[0, 1, 2].map(i => {
                        if (images[i]) {
                            return `
                                <div class="mob-editor__image">
                                    <img src="${images[i].url || images[i]}" alt="Изображение ${i + 1}">
                                    <div class="mob-editor__image-remove" onclick="removeGalleryImage(${index}, ${i})">×</div>
                                </div>
                            `;
                        } else {
                            return `
                                <div class="mob-editor__image add-image" onclick="uploadGalleryImage(${index}, ${i})">
                                </div>
                            `;
                        }
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

// Генерация слайда "Сетка" для мобильной версии
function generateMobileGridSlide(slide, index) {
    const images = slide.images || [];
    
    return `
        <div class="swiper-slide mob-editor__slide">
            <div class="mob-editor__block">
                <label class="mob-editor__label">Сетка (4 изображения)</label>
                <div class="mob-editor__images">
                    ${[0, 1, 2, 3].map(i => {
                        if (images[i]) {
                            return `
                                <div class="mob-editor__image">
                                    <img src="${images[i].url || images[i]}" alt="Изображение ${i + 1}">
                                    <div class="mob-editor__image-remove" onclick="removeGridImage(${index}, ${i})">×</div>
                                </div>
                            `;
                        } else {
                            return `
                                <div class="mob-editor__image add-image" onclick="uploadGridImage(${index}, ${i})">
                                </div>
                            `;
                        }
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

// Генерация слайда "Описание" для мобильной версии
function generateMobileDescriptionSlide(slide, index) {
    const images = slide.images || [];
    // Конвертируем HTML в текст для textarea
    const content = htmlToTextForTextarea(slide.content || '');
    
    return `
        <div class="swiper-slide mob-editor__slide">
            <div class="mob-editor__block">
                <label class="mob-editor__label">Заголовок</label>
                <input type="text" 
                       class="mob-editor__input"
                       data-slide="${index}"
                       data-field="title"
                       value="${slide.title || 'ОПИСАНИЕ'}"
                       placeholder="ОПИСАНИЕ">
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">
                    Текст описания
                    <button type="button" class="mob-btn-generate-text" onclick="generateTextWithAI(${index}, 'description')" title="Сгенерировать текст с помощью AI">
                        <i class="fas fa-magic"></i> AI
                    </button>
                </label>
                <textarea class="mob-editor__textarea ai-textarea" 
                          data-slide="${index}" 
                          data-field="content"
                          placeholder="Подробно опишите о своем объекте...">${content}</textarea>
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">Изображения</label>
                <div class="mob-editor__images">
                    ${[0, 1].map(i => {
                        if (images[i]) {
                            return `
                                <div class="mob-editor__image">
                                    <img src="${images[i].url || images[i]}" alt="Изображение ${i + 1}">
                                    <div class="mob-editor__image-remove" onclick="removeDescriptionImage(${index}, ${i})">×</div>
                                </div>
                            `;
                        } else {
                            return `
                                <div class="mob-editor__image add-image" onclick="uploadDescriptionImage(${index}, ${i})">
                                </div>
                            `;
                        }
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

// Генерация слайда "Инфраструктура" для мобильной версии
function generateMobileInfrastructureSlide(slide, index) {
    const images = slide.images || [];
    // Конвертируем HTML в текст для textarea
    const content = htmlToTextForTextarea(slide.content || '');
    
    return `
        <div class="swiper-slide mob-editor__slide">
            <div class="mob-editor__block">
                <label class="mob-editor__label">Заголовок</label>
                <input type="text" 
                       class="mob-editor__input"
                       data-slide="${index}"
                       data-field="title"
                       value="${slide.title || 'ИНФРАСТРУКТУРА'}"
                       placeholder="ИНФРАСТРУКТУРА">
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">
                    Текст инфраструктуры
                    <button type="button" class="mob-btn-generate-text" onclick="generateTextWithAI(${index}, 'infrastructure')" title="Сгенерировать текст с помощью AI">
                        <i class="fas fa-magic"></i> AI
                    </button>
                </label>
                <textarea class="mob-editor__textarea ai-textarea" 
                          data-slide="${index}" 
                          data-field="content"
                          placeholder="Подробно опишите, что находится вблизи...">${content}</textarea>
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">Изображения</label>
                <div class="mob-editor__images">
                    ${[0, 1].map(i => {
                        if (images[i]) {
                            return `
                                <div class="mob-editor__image">
                                    <img src="${images[i].url || images[i]}" alt="Изображение ${i + 1}">
                                    <div class="mob-editor__image-remove" onclick="removeInfrastructureImage(${index}, ${i})">×</div>
                                </div>
                            `;
                        } else {
                            return `
                                <div class="mob-editor__image add-image" onclick="uploadInfrastructureImage(${index}, ${i})">
                                </div>
                            `;
                        }
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

// Генерация слайда "Особенности" для мобильной версии
function generateMobileFeaturesSlide(slide, index) {
    const items = slide.items || [];
    const images = slide.images || [];
    
    return `
        <div class="swiper-slide mob-editor__slide">
            <div class="mob-editor__block">
                <label class="mob-editor__label">Заголовок</label>
                <input type="text" 
                       class="mob-editor__input"
                       data-slide="${index}"
                       data-field="title"
                       value="${slide.title || 'ОСОБЕННОСТИ'}"
                       placeholder="ОСОБЕННОСТИ">
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">Изображения</label>
                <div class="mob-editor__images">
                    ${[0, 1].map(i => {
                        if (images[i]) {
                            return `
                                <div class="mob-editor__image">
                                    <img src="${images[i].url || images[i]}" alt="Особенность ${i + 1}">
                                    <div class="mob-editor__image-remove" onclick="removeFeatureImage(${index}, ${i})">×</div>
                                </div>
                            `;
                        } else {
                            return `
                                <div class="mob-editor__image add-image" onclick="uploadFeatureImage(${index}, ${i})">
                                </div>
                            `;
                        }
                    }).join('')}
                </div>
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">Особенности (макс. 9)</label>
                ${items.map((item, i) => `
                    <div class="mob-editor__param">
                        <input type="text" 
                               placeholder="Особенность"
                               data-slide="${index}"
                               data-item="${i}"
                               data-field="text"
                               value="${item.text || ''}">
                        <button class="mob-editor__param-remove" onclick="removeFeature(${index}, ${i})">×</button>
                    </div>
                `).join('')}
                
                ${items.length < 9 ? `
                    <button class="mob-editor__add-param" onclick="addFeature(${index})">
                        + Добавить особенность
                    </button>
                ` : '<div class="limit-warning">Достигнут лимит 9 особенностей</div>'}
            </div>
        </div>
    `;
}

// Генерация слайда "Местоположение" для мобильной версии
function generateMobileLocationSlide(slide, index) {
    const lat = slide.location_lat || 55.755864;
    const lng = slide.location_lng || 37.617698;
    const address = slide.location_address || 'Москва';
    const metroStations = slide.metro_stations || [];
    const showMetro = slide.show_metro !== false; // По умолчанию показываем
    
    return `
        <div class="swiper-slide mob-editor__slide">
            <div class="mob-editor__block">
                <label class="mob-editor__label">Заголовок</label>
                <input type="text" 
                       class="mob-editor__input"
                       data-slide="${index}"
                       data-field="title"
                       value="${slide.title || 'МЕСТОПОЛОЖЕНИЕ'}"
                       placeholder="МЕСТОПОЛОЖЕНИЕ">
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">Название объекта</label>
                <input type="text" 
                       class="mob-editor__input"
                       data-slide="${index}"
                       data-field="location_name"
                       value="${(slide.location_name || 'ЖК "Успешная продажа"').replace(/"/g, '&quot;')}"
                       placeholder="Название объекта">
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">Адрес (начните вводить для подсказок)</label>
                <input type="text" 
                       class="mob-editor__input mobile-location-address-input"
                       id="mobile-location-address-${index}"
                       data-slide="${index}"
                       data-field="location_address"
                       value="${address}"
                       placeholder="Введите адрес для поиска">
                <input type="hidden" id="mobile-location-lat-${index}" value="${lat}" data-field="location_lat" data-slide="${index}">
                <input type="hidden" id="mobile-location-lng-${index}" value="${lng}" data-field="location_lng" data-slide="${index}">
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">Карта местоположения</label>
                <div id="mobile-yandex-map-${index}" class="mobile-yandex-map-container" style="width: 100%; height: 250px; border-radius: 8px; background: #f0f0f0; position: relative;">
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #999;">
                        <i class="fas fa-spinner fa-spin"></i> Загрузка карты...
                    </div>
                </div>
            </div>
            
            <div class="mob-editor__block">
                <button type="button" 
                        class="mob-editor__btn mob-editor__btn--primary"
                        onclick="findNearestMetroMobile(${index})"
                        style="width: 100%; padding: 12px; font-size: 14px; background: #2196f3; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-subway"></i> Найти ближайшее метро
                </button>
            </div>
            
            <div id="mobile-metro-info-${index}" class="mob-editor__block" style="display: ${metroStations.length > 0 ? 'block' : 'none'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <label class="mob-editor__label" style="margin: 0;">Станции метро</label>
                    <label style="display: flex; align-items: center; font-size: 12px; color: #666;">
                        <input type="checkbox" 
                               id="mobile-show-metro-${index}"
                               data-slide="${index}"
                               data-field="show_metro"
                               ${showMetro ? 'checked' : ''}
                               onchange="toggleMetroVisibilityMobile(${index})"
                               style="margin-right: 4px;">
                        Показывать в презентации
                    </label>
                </div>
                <div id="mobile-metro-list-${index}" style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 12px; border-radius: 4px; font-size: 13px;">
                    ${renderMetroListMobile(metroStations)}
                </div>
            </div>
        </div>
    `;
}

// Генерация слайда "Контакты" для мобильной версии
function generateMobileContactsSlide(slide, index) {
    const images = slide.images || [];
    
    return `
        <div class="swiper-slide mob-editor__slide">
            <div class="mob-editor__block">
                <label class="mob-editor__label">Заголовок</label>
                <input type="text" 
                       class="mob-editor__input"
                       data-slide="${index}"
                       data-field="contact_title"
                       value="${slide.contact_title || 'Контакты'}"
                       placeholder="Контакты">
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">Аватар</label>
                <div class="mob-editor__avatar-wrapper">
                    ${slide.avatar ? `
                        <div class="mob-editor__avatar has-image" onclick="uploadMobileImage(${index}, 'avatar')">
                            <img src="${slide.avatar}" alt="Аватар">
                            <div class="mob-editor__image-remove" onclick="event.stopPropagation(); removeMobileImage(${index}, 'avatar')">×</div>
                        </div>
                    ` : `
                        <div class="mob-editor__avatar" onclick="uploadMobileImage(${index}, 'avatar')">
                        </div>
                    `}
                </div>
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">Имя</label>
                <input type="text" 
                       class="mob-editor__input"
                       data-slide="${index}"
                       data-field="contact_name"
                       value="${slide.contact_name || 'Slide Estate'}"
                       placeholder="Имя">
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">Должность/Роль</label>
                <input type="text" 
                       class="mob-editor__input"
                       data-slide="${index}"
                       data-field="contact_role"
                       value="${slide.contact_role || 'Онлайн-сервис для риелторов'}"
                       placeholder="Должность">
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">Телефон</label>
                <input type="text" 
                       class="mob-editor__input"
                       data-slide="${index}"
                       data-field="contact_phone"
                       value="${slide.contact_phone || '+7 (900) 000-00-00'}"
                       placeholder="Телефон">
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">Мессенджеры</label>
                <input type="text" 
                       class="mob-editor__input"
                       data-slide="${index}"
                       data-field="contact_messengers"
                       value="${slide.contact_messengers || 'Telegram | WhatsApp'}"
                       placeholder="Мессенджеры">
            </div>
            
            <div class="mob-editor__block">
                <label class="mob-editor__label">Изображения</label>
                <div class="mob-editor__images">
                    ${[0, 1].map(i => {
                        if (images[i]) {
                            return `
                                <div class="mob-editor__image">
                                    <img src="${images[i].url || images[i]}" alt="Изображение ${i + 1}">
                                    <div class="mob-editor__image-remove" onclick="removeContactImage(${index}, ${i})">×</div>
                                </div>
                            `;
                        } else {
                            return `
                                <div class="mob-editor__image add-image" onclick="uploadContactImage(${index}, ${i})">
                                </div>
                            `;
                        }
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

// Настройка событий для мобильного редактора
// Функция автоматического изменения высоты textarea
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = textarea.classList.contains('ai-textarea') ? 500 : 270;
    const minHeight = 268;
    const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
    textarea.style.height = newHeight + 'px';
    textarea.style.overflowY = scrollHeight > newHeight ? 'auto' : 'hidden';
}

function setupMobileSlideEvents() {
    // Обработка ввода в текстовые поля
    document.querySelectorAll('.mob-editor__textarea, .mob-editor__input').forEach(element => {
        // Инициализация высоты для textarea (кроме титульного слайда)
        if (element.classList.contains('mob-editor__textarea')) {
            const slideIndex = parseInt(element.dataset.slide);
            const field = element.dataset.field;
            // Для титульного слайда не применяем autoResizeTextarea
            if (slides[slideIndex] && slides[slideIndex].type === 'cover' && (field === 'title' || field === 'subtitle')) {
                // Для титульного слайда просто устанавливаем минимальную высоту без фиксированной
                element.style.height = 'auto';
                element.style.minHeight = '44px';
                element.style.overflowY = 'auto';
            } else {
                autoResizeTextarea(element);
            }
        }
        
        element.addEventListener('input', function() {
            // Авто-ресайз для textarea (кроме титульного слайда)
            if (this.classList.contains('mob-editor__textarea')) {
                const slideIndex = parseInt(this.dataset.slide);
                const field = this.dataset.field;
                // Для титульного слайда не применяем autoResizeTextarea
                if (slides[slideIndex] && slides[slideIndex].type === 'cover' && (field === 'title' || field === 'subtitle')) {
                    // Для титульного слайда просто устанавливаем автоматическую высоту
                    this.style.height = 'auto';
                    this.style.minHeight = '44px';
                    this.style.overflowY = 'auto';
                } else {
                    autoResizeTextarea(this);
                }
            }
            
            const slideIndex = parseInt(this.dataset.slide);
            const field = this.dataset.field;
            
            if (this.dataset.item !== undefined) {
                const itemIndex = parseInt(this.dataset.item);
                if (!slides[slideIndex].items) slides[slideIndex].items = [];
                if (!slides[slideIndex].items[itemIndex]) slides[slideIndex].items[itemIndex] = {};
                slides[slideIndex].items[itemIndex][field] = this.value;
            } else {
                // Для textarea с заголовками заменяем \n на <br>
                if (this.classList.contains('mob-editor__textarea') && (field === 'title' || field === 'subtitle')) {
                    slides[slideIndex][field] = this.value.replace(/\n/g, '<br>');
                } else if (field === 'content') {
                    // Для content конвертируем текст в HTML (поддерживаем markdown разметку)
                    let contentValue = this.value;
                    // Конвертируем markdown в HTML (включая переносы строк)
                    slides[slideIndex][field] = markdownToHtml(contentValue);
                } else {
                    slides[slideIndex][field] = this.value;
                }
            }
            
            console.log('Изменение поля в мобильной версии:', field, 'слайд:', slideIndex);
            if (typeof hasUnsavedChanges !== 'undefined') {
                hasUnsavedChanges = true;
            }
            
            // Вызываем автосохранение
            if (typeof triggerAutoSave === 'function') {
                console.log('Вызываю triggerAutoSave из setupMobileSlideEvents');
                triggerAutoSave();
            } else {
                console.warn('triggerAutoSave не доступна в setupMobileSlideEvents');
                // Fallback: прямое сохранение через небольшую задержку
                if (typeof savePresentation === 'function') {
                    clearTimeout(window.mobileAutoSaveTimer);
                    window.mobileAutoSaveTimer = setTimeout(() => {
                        savePresentation(true, 'draft');
                    }, 2000);
                }
            }
        });
    });
    
    // Обновляем валюты для слайдов обложки (с небольшой задержкой для гарантии загрузки DOM)
    setTimeout(() => {
        slides.forEach((slide, index) => {
            if (slide.type === 'cover' && typeof updateCurrencyConversions === 'function') {
                updateCurrencyConversions(index);
            }
        });
    }, 200);
}

// Удаление изображения в мобильной версии
function removeMobileImage(slideIndex, field) {
    if (confirm('Удалить изображение?')) {
        delete slides[slideIndex][field];
        renderMobileSlides();
        mobEditorSwiper.update();
        mobEditorSwiper.slideTo(slideIndex);
        hasUnsavedChanges = true;
        showMobileNotification('Изображение удалено');
        triggerAutoSave();
    }
}

// Удаление изображения из галереи
function removeGalleryImage(slideIndex, position) {
    if (confirm('Удалить изображение из галереи?')) {
        if (slides[slideIndex].images && slides[slideIndex].images[position]) {
            slides[slideIndex].images.splice(position, 1);
            renderMobileSlides();
            mobEditorSwiper.update();
            mobEditorSwiper.slideTo(slideIndex);
            hasUnsavedChanges = true;
            showMobileNotification('Изображение удалено');
            triggerAutoSave();
        }
    }
}

// Удаление изображения из сетки
function removeGridImage(slideIndex, position) {
    if (confirm('Удалить изображение из сетки?')) {
        if (slides[slideIndex].images && slides[slideIndex].images[position]) {
            slides[slideIndex].images.splice(position, 1);
            renderMobileSlides();
            mobEditorSwiper.update();
            mobEditorSwiper.slideTo(slideIndex);
            hasUnsavedChanges = true;
            showMobileNotification('Изображение удалено');
            triggerAutoSave();
        }
    }
}

// Удаление изображения описания
function removeDescriptionImage(slideIndex, position) {
    if (confirm('Удалить изображение?')) {
        if (slides[slideIndex].images && slides[slideIndex].images[position]) {
            slides[slideIndex].images.splice(position, 1);
            renderMobileSlides();
            mobEditorSwiper.update();
            mobEditorSwiper.slideTo(slideIndex);
            hasUnsavedChanges = true;
            showMobileNotification('Изображение удалено');
            triggerAutoSave();
        }
    }
}

// Удаление изображения инфраструктуры
function removeInfrastructureImage(slideIndex, position) {
    if (confirm('Удалить изображение?')) {
        if (slides[slideIndex].images && slides[slideIndex].images[position]) {
            slides[slideIndex].images.splice(position, 1);
            renderMobileSlides();
            mobEditorSwiper.update();
            mobEditorSwiper.slideTo(slideIndex);
            hasUnsavedChanges = true;
            showMobileNotification('Изображение удалено');
            triggerAutoSave();
        }
    }
}

// Удаление изображения особенности
function removeFeatureImage(slideIndex, position) {
    if (confirm('Удалить изображение?')) {
        if (slides[slideIndex].images && slides[slideIndex].images[position]) {
            slides[slideIndex].images.splice(position, 1);
            renderMobileSlides();
            mobEditorSwiper.update();
            mobEditorSwiper.slideTo(slideIndex);
            hasUnsavedChanges = true;
            showMobileNotification('Изображение удалено');
            triggerAutoSave();
        }
    }
}

// Удаление изображения контактов
function removeContactImage(slideIndex, position) {
    if (confirm('Удалить изображение?')) {
        if (slides[slideIndex].images && slides[slideIndex].images[position]) {
            slides[slideIndex].images.splice(position, 1);
            renderMobileSlides();
            mobEditorSwiper.update();
            mobEditorSwiper.slideTo(slideIndex);
            hasUnsavedChanges = true;
            showMobileNotification('Изображение удалено');
            triggerAutoSave();
        }
    }
}

// Загрузка изображения в мобильной версии
async function uploadMobileImage(slideIndex, type) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.dataset.slide = slideIndex;
    input.dataset.uploadType = type;
    
    input.onchange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const result = await handleFileUpload(e.target.files[0], input);
            if (result && result.success) {
                renderMobileSlides();
                mobEditorSwiper.update();
                mobEditorSwiper.slideTo(slideIndex);
                // Автосохранение после успешной загрузки изображения
                if (typeof hasUnsavedChanges !== 'undefined') {
                    hasUnsavedChanges = true;
                }
                if (typeof triggerAutoSave === 'function') {
                    triggerAutoSave();
                }
            }
        }
    };
    
    input.click();
}

// Загрузка изображения в галерею
async function uploadGalleryImage(slideIndex, position) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.dataset.slide = slideIndex;
    input.dataset.uploadType = 'gallery';
    input.dataset.position = position;
    
    input.onchange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const result = await handleFileUpload(e.target.files[0], input);
            if (result && result.success) {
                renderMobileSlides();
                mobEditorSwiper.update();
                mobEditorSwiper.slideTo(slideIndex);
                // Автосохранение после успешной загрузки изображения
                if (typeof hasUnsavedChanges !== 'undefined') {
                    hasUnsavedChanges = true;
                }
                if (typeof triggerAutoSave === 'function') {
                    triggerAutoSave();
                }
            }
        }
    };
    
    input.click();
}

// Загрузка изображения в сетку
async function uploadGridImage(slideIndex, position) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.dataset.slide = slideIndex;
    input.dataset.uploadType = 'grid';
    input.dataset.position = position;
    
    input.onchange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const result = await handleFileUpload(e.target.files[0], input);
            if (result && result.success) {
                renderMobileSlides();
                mobEditorSwiper.update();
                mobEditorSwiper.slideTo(slideIndex);
                // Автосохранение после успешной загрузки изображения
                if (typeof hasUnsavedChanges !== 'undefined') {
                    hasUnsavedChanges = true;
                }
                if (typeof triggerAutoSave === 'function') {
                    triggerAutoSave();
                }
            }
        }
    };
    
    input.click();
}

// Загрузка изображения для описания
async function uploadDescriptionImage(slideIndex, position) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.dataset.slide = slideIndex;
    input.dataset.uploadType = 'gallery';
    input.dataset.position = position;
    
    input.onchange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const result = await handleFileUpload(e.target.files[0], input);
            if (result && result.success) {
                renderMobileSlides();
                mobEditorSwiper.update();
                mobEditorSwiper.slideTo(slideIndex);
                // Автосохранение после успешной загрузки изображения
                if (typeof hasUnsavedChanges !== 'undefined') {
                    hasUnsavedChanges = true;
                }
                if (typeof triggerAutoSave === 'function') {
                    triggerAutoSave();
                }
            }
        }
    };
    
    input.click();
}

// Загрузка изображения для инфраструктуры
async function uploadInfrastructureImage(slideIndex, position) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.dataset.slide = slideIndex;
    input.dataset.uploadType = 'gallery';
    input.dataset.position = position;
    
    input.onchange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const result = await handleFileUpload(e.target.files[0], input);
            if (result && result.success) {
                renderMobileSlides();
                mobEditorSwiper.update();
                mobEditorSwiper.slideTo(slideIndex);
                // Автосохранение после успешной загрузки изображения
                if (typeof hasUnsavedChanges !== 'undefined') {
                    hasUnsavedChanges = true;
                }
                if (typeof triggerAutoSave === 'function') {
                    triggerAutoSave();
                }
            }
        }
    };
    
    input.click();
}

// Загрузка изображения для особенности
async function uploadFeatureImage(slideIndex, position) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.dataset.slide = slideIndex;
    input.dataset.uploadType = 'gallery';
    input.dataset.position = position;
    
    input.onchange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const result = await handleFileUpload(e.target.files[0], input);
            if (result && result.success) {
                renderMobileSlides();
                mobEditorSwiper.update();
                mobEditorSwiper.slideTo(slideIndex);
                // Автосохранение после успешной загрузки изображения
                if (typeof hasUnsavedChanges !== 'undefined') {
                    hasUnsavedChanges = true;
                }
                if (typeof triggerAutoSave === 'function') {
                    triggerAutoSave();
                }
            }
        }
    };
    
    input.click();
}

// Загрузка изображения для контактов
async function uploadContactImage(slideIndex, position) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.dataset.slide = slideIndex;
    input.dataset.uploadType = 'gallery';
    input.dataset.position = position;
    
    input.onchange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const result = await handleFileUpload(e.target.files[0], input);
            if (result && result.success) {
                renderMobileSlides();
                mobEditorSwiper.update();
                mobEditorSwiper.slideTo(slideIndex);
                // Автосохранение после успешной загрузки изображения
                if (typeof hasUnsavedChanges !== 'undefined') {
                    hasUnsavedChanges = true;
                }
                if (typeof triggerAutoSave === 'function') {
                    triggerAutoSave();
                }
            }
        }
    };
    
    input.click();
}

// Добавление характеристики
function addCharacteristic(slideIndex) {
    if (!slides[slideIndex].items) slides[slideIndex].items = [];
    
    if (slides[slideIndex].items.length >= 12) {
        showMobileNotification('Максимальное количество характеристик - 12', 'error');
        return;
    }
    
    slides[slideIndex].items.push({ label: 'Название', value: 'Значение' });
    renderMobileSlides();
    mobEditorSwiper.update();
    mobEditorSwiper.slideTo(slideIndex);
    hasUnsavedChanges = true;
    showMobileNotification('Характеристика добавлена');
    triggerAutoSave();
}

// Удаление характеристики
function removeCharacteristic(slideIndex, itemIndex) {
    if (confirm('Удалить эту характеристику?')) {
        slides[slideIndex].items.splice(itemIndex, 1);
        renderMobileSlides();
        mobEditorSwiper.update();
        mobEditorSwiper.slideTo(slideIndex);
        hasUnsavedChanges = true;
        showMobileNotification('Характеристика удалена');
        triggerAutoSave();
    }
}

// Добавление особенности
function addFeature(slideIndex) {
    if (!slides[slideIndex].items) slides[slideIndex].items = [];
    
    if (slides[slideIndex].items.length >= 9) {
        showMobileNotification('Максимальное количество особенностей - 9', 'error');
        return;
    }
    
    slides[slideIndex].items.push({ text: 'Новая особенность' });
    renderMobileSlides();
    mobEditorSwiper.update();
    mobEditorSwiper.slideTo(slideIndex);
    hasUnsavedChanges = true;
    showMobileNotification('Особенность добавлена');
    triggerAutoSave();
}

// Удаление особенности
function removeFeature(slideIndex, itemIndex) {
    if (confirm('Удалить эту особенность?')) {
        slides[slideIndex].items.splice(itemIndex, 1);
        renderMobileSlides();
        mobEditorSwiper.update();
        mobEditorSwiper.slideTo(slideIndex);
        hasUnsavedChanges = true;
        showMobileNotification('Особенность удалена');
        triggerAutoSave();
    }
}

// Обновление цены в мобильной версии
async function updateMobilePrice(slideIndex, formattedValue) {
    const rawValue = parseFormattedNumber(formattedValue);
    slides[slideIndex].price_value = rawValue;
    
    // Обновляем конвертер валют
    if (typeof updateCurrencyConversions === 'function') {
        await updateCurrencyConversions(slideIndex);
    }
    
    hasUnsavedChanges = true;
    triggerAutoSave();
}

// Показ модального окна выбора
function showChoiceModal(slideIndex, type) {
    const modal = document.getElementById('choiceModal');
    const list = document.getElementById('choiceList');
    
    let items = [];
    if (type === 'deal_type') {
        items = ['Аренда', 'Продажа'];
    } else if (type === 'currency') {
        items = [
            { value: 'RUB', label: '₽ Рубль' },
            { value: 'USD', label: '$ Доллар' },
            { value: 'EUR', label: '€ Евро' },
            { value: 'CNY', label: '¥ Юань' },
            { value: 'KZT', label: '₸ Тенге' }
        ];
    }
    
    list.innerHTML = items.map(item => {
        const value = typeof item === 'object' ? item.value : item;
        const label = typeof item === 'object' ? item.label : item;
        const isActive = slides[slideIndex][type] === value;
        
        return `<div class="mob-editor__list-item ${isActive ? 'active' : ''}" 
                     onclick="selectChoice(${slideIndex}, '${type}', '${value}')">
                    ${label}
                </div>`;
    }).join('');
    
    modal.classList.add('open');
    
    // Закрытие по клику вне списка
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('open');
        }
    });
}

// Выбор в модальном окне
async function selectChoice(slideIndex, type, value) {
    slides[slideIndex][type] = value;
    
    const modal = document.getElementById('choiceModal');
    modal.classList.remove('open');
    
    // Обновляем конвертер валют при смене валюты или типа сделки
    if ((type === 'currency' || type === 'deal_type') && typeof updateCurrencyConversions === 'function') {
        await updateCurrencyConversions(slideIndex);
    }
    
    renderMobileSlides();
    mobEditorSwiper.update();
    mobEditorSwiper.slideTo(slideIndex);
    hasUnsavedChanges = true;
    triggerAutoSave();
}

// Рендеринг навигации слайдов
function renderMobileNavigation() {
    const wrapper = document.getElementById('mobNavSwiperWrapper');
    if (!wrapper) return;
    
    wrapper.innerHTML = '';
    
    const slideTypeNames = {
        'cover': 'Титульный слайд',
        'image': 'Слайд на 1 фото',
        'characteristics': 'Характеристики объекта',
        'layout': 'Планировка',
        'gallery': 'Слайд на 3 фото',
        'features': 'Особенности',
        'grid': 'Слайд на 4 фото',
        'description': 'Описание',
        'infrastructure': 'Инфраструктура',
        'location': 'Местоположение',
        'contacts': 'Контакты'
    };
    
    slides.forEach((slide, index) => {
        const slideName = slideTypeNames[slide.type] || 'Слайд ' + (index + 1);
        
        const slideHtml = `
            <div class="swiper-slide mob-editor-nav__slide" 
                 data-slide-index="${index}">
                <span class="mob-editor-nav__title" onclick="switchToSlide(${index})">
                    ${slideName}
                </span>
            </div>
        `;
        wrapper.insertAdjacentHTML('beforeend', slideHtml);
    });
    
    // Обновляем Swiper
    if (mobNavSwiper) {
        mobNavSwiper.update();
        setTimeout(() => {
            updateNavigation();
        }, 50);
    }
}


// Обновление навигации
function updateNavigation() {
    if (mobNavSwiper) {
        const navSlides = document.querySelectorAll('.mob-editor-nav__slide');
        navSlides.forEach((slide, index) => {
            slide.classList.toggle('swiper-slide-thumb-active', index === currentSlideIndex);
        });
        mobNavSwiper.slideTo(currentSlideIndex);
    }
}

// Перемещение слайда в навигации
function moveSlideInNav(slideIndex, direction) {
    const newIndex = slideIndex + direction;
    
    if (newIndex < 0 || newIndex >= slides.length) {
        return;
    }
    
    // Сохраняем текущий индекс для сохранения позиции
    const currentActiveIndex = currentSlideIndex;
    
    // Перемещаем слайд в массиве
    const temp = slides[slideIndex];
    slides[slideIndex] = slides[newIndex];
    slides[newIndex] = temp;
    
    // Обновляем текущий индекс если он был затронут перемещением
    if (currentActiveIndex === slideIndex) {
        currentSlideIndex = newIndex;
    } else if (currentActiveIndex === newIndex) {
        currentSlideIndex = slideIndex;
    } else if (direction > 0 && currentActiveIndex > slideIndex && currentActiveIndex <= newIndex) {
        // Если перемещаем вниз, сдвигаем индексы между ними
        currentSlideIndex = currentActiveIndex - 1;
    } else if (direction < 0 && currentActiveIndex >= newIndex && currentActiveIndex < slideIndex) {
        // Если перемещаем вверх, сдвигаем индексы между ними
        currentSlideIndex = currentActiveIndex + 1;
    }
    
    // Обновляем навигацию
    renderMobileNavigation();
    
    // Обновляем слайды
    renderMobileSlides();
    
    // Обновляем Swiper
    if (mobEditorSwiper) {
        mobEditorSwiper.update();
    }
    
    // Переходим на текущий слайд (не сбрасываем позицию)
    setTimeout(() => {
        switchToSlide(currentSlideIndex);
        updateButtons();
        
        // Сохраняем изменения после всех обновлений
        if (typeof hasUnsavedChanges !== 'undefined') {
            hasUnsavedChanges = true;
        }
        // Вызываем автосохранение немедленно после перемещения
        if (typeof triggerAutoSave === 'function') {
            triggerAutoSave();
        } else if (typeof savePresentation === 'function') {
            // Fallback: прямое сохранение если triggerAutoSave недоступен
            savePresentation(true, 'draft');
        }
    }, 100);
    
    showMobileNotification('Слайд перемещен');
}

// Удаление слайда из навигации
function deleteSlideInNav(slideIndex) {
    if (slides.length <= 1) {
        showMobileNotification('Нельзя удалить единственный слайд', 'error');
        return;
    }
    
    if (!confirm('Вы уверены, что хотите удалить этот слайд?')) {
        return;
    }
    
    // Сохраняем текущий индекс для сохранения позиции
    const currentActiveIndex = currentSlideIndex;
    
    // Удаляем слайд
    slides.splice(slideIndex, 1);
    
    // Обновляем текущий индекс после удаления
    if (currentActiveIndex === slideIndex) {
        // Если удалили текущий слайд, переходим на предыдущий или первый
        currentSlideIndex = Math.min(slideIndex, slides.length - 1);
    } else if (currentActiveIndex > slideIndex) {
        // Если удалили слайд перед текущим, уменьшаем индекс
        currentSlideIndex = currentActiveIndex - 1;
    }
    // Если удалили слайд после текущего, индекс не меняется
    
    // Обновляем навигацию
    renderMobileNavigation();
    
    // Обновляем слайды
    renderMobileSlides();
    
    // Обновляем Swiper
    if (mobEditorSwiper) {
        mobEditorSwiper.update();
    }
    
    // Переходим на текущий слайд (не сбрасываем позицию)
    setTimeout(() => {
        switchToSlide(currentSlideIndex);
        updateButtons();
        
        // Сохраняем изменения после всех обновлений
        if (typeof hasUnsavedChanges !== 'undefined') {
            hasUnsavedChanges = true;
        }
        // Вызываем автосохранение немедленно после удаления
        if (typeof triggerAutoSave === 'function') {
            triggerAutoSave();
        } else if (typeof savePresentation === 'function') {
            // Fallback: прямое сохранение если triggerAutoSave недоступен
            savePresentation(true, 'draft');
        }
    }, 100);
    
    showMobileNotification('Слайд удален');
}

// Переключение видимости слайда (мобильная версия)
function toggleSlideVisibilityMobile(slideIndex) {
    if (!slides[slideIndex]) return;
    
    slides[slideIndex].hidden = !slides[slideIndex].hidden;
    
    // Обновляем навигацию
    renderMobileNavigation();
    
    // Обновляем слайды
    renderMobileSlides();
    
    // Обновляем Swiper
    if (mobEditorSwiper) {
        mobEditorSwiper.update();
    }
    
    // Сохраняем изменения
    if (typeof hasUnsavedChanges !== 'undefined') {
        hasUnsavedChanges = true;
    }
    if (typeof triggerAutoSave === 'function') {
        triggerAutoSave();
    }
    
    showMobileNotification(slides[slideIndex].hidden ? 'Слайд скрыт' : 'Слайд показан');
}

// Обновление кнопок навигации
function updateButtons() {
    const prevBtn = document.querySelector('.mob-editor-buttons__prev');
    const nextBtn = document.querySelector('.mob-editor-buttons__next');
    const addBtn = document.querySelector('.mob-editor-buttons__add');
    const settingsBtn = document.querySelector('.mob-editor-buttons__settings');
    
    const isSingleSlide = slides.length === 1;
    
    if (isSingleSlide) {
        // Если осталась только одна вкладка - скрываем кнопки "Назад" и "Вперед"
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        // Показываем кнопки добавления и настроек
        if (addBtn) addBtn.style.display = 'flex';
        if (settingsBtn) settingsBtn.style.display = 'flex';
    } else {
        // Если несколько вкладок - показываем кнопки навигации
        if (prevBtn) {
            prevBtn.style.display = currentSlideIndex === 0 ? 'none' : 'flex';
        }
        if (nextBtn) {
            nextBtn.style.display = currentSlideIndex === slides.length - 1 ? 'none' : 'flex';
        }
        // Кнопки добавления и настроек всегда видны
        if (addBtn) addBtn.style.display = 'flex';
        if (settingsBtn) settingsBtn.style.display = 'flex';
    }
}

// Переключение на слайд
function switchToSlide(index) {
    if (mobEditorSwiper && index >= 0 && index < slides.length) {
        mobEditorSwiper.slideTo(index);
        currentSlideIndex = index;
        updateNavigation();
        updateButtons();
    }
}

// Следующий слайд
function nextSlide() {
    if (currentSlideIndex < slides.length - 1) {
        switchToSlide(currentSlideIndex + 1);
    }
}

// Предыдущий слайд
function prevSlide() {
    if (currentSlideIndex > 0) {
        switchToSlide(currentSlideIndex - 1);
    }
}

// Очистка текущего слайда
function clearCurrentSlide() {
    if (confirm('Очистить все поля текущего слайда?')) {
        const slide = slides[currentSlideIndex];
        const type = slide.type;
        
        // Сохраняем только тип слайда
        slides[currentSlideIndex] = { type: type, hidden: false };
        
        renderMobileSlides();
        mobEditorSwiper.update();
        mobEditorSwiper.slideTo(currentSlideIndex);
        if (typeof hasUnsavedChanges !== 'undefined') {
            hasUnsavedChanges = true;
        }
        showMobileNotification('Поля очищены');
        // Автосохранение после очистки полей
        if (typeof triggerAutoSave === 'function') {
            triggerAutoSave();
        } else if (typeof savePresentation === 'function') {
            // Fallback: прямое сохранение если triggerAutoSave недоступен
            savePresentation(true, 'draft');
        }
    }
}

function addMobileSlide() {
    // можно открыть модальное, как в десктопе, или добавить по умолчанию, напр. image
    addSlide(); // если есть глобальная функция
    renderMobileSlides();
    mobEditorSwiper.update();
    switchToSlide(slides.length - 1);
}

function removeMobileSlide() {
    if (!confirm('Удалить текущий слайд?')) return;
    deleteSlide(currentSlideIndex); // твоя десктопная функция
    renderMobileSlides();
    mobEditorSwiper.update();
    if (currentSlideIndex >= slides.length) currentSlideIndex = slides.length - 1;
    switchToSlide(currentSlideIndex);
}

function moveMobileSlideUp() {
    if (currentSlideIndex <= 0) return;
    moveSlide(currentSlideIndex, currentSlideIndex - 1); // твоя функция
    renderMobileSlides();
    mobEditorSwiper.update();
    switchToSlide(currentSlideIndex - 1);
}

function moveMobileSlideDown() {
    if (currentSlideIndex >= slides.length - 1) return;
    moveSlide(currentSlideIndex, currentSlideIndex + 1);
    renderMobileSlides();
    mobEditorSwiper.update();
    switchToSlide(currentSlideIndex + 1);
}


// Сохранение в мобильной версии
async function saveMobilePresentation() {
    try {
        await savePresentation(false, 'draft');
        showMobileNotification('Сохранено успешно!');
    } catch (error) {
        showMobileNotification('Ошибка сохранения', 'error');
    }
}

// Предпросмотр в мобильной версии
function previewMobilePresentation() {
    saveMobilePresentation().then(() => {
        const url = `/api.php?action=generate_presentation&id=${presentationId}`;
        window.open(url, '_blank');
    });
}

// Экспорт в PDF в мобильной версии
function exportMobileToPDF() {
    saveMobilePresentation().then(() => {
        const url = `/api.php?action=export_pdf&id=${presentationId}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.open(data.print_url, '_blank');
                } else {
                    showMobileNotification('Ошибка экспорта: ' + (data.error || 'Неизвестная ошибка'), 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMobileNotification('Ошибка соединения с сервером', 'error');
            });
    });
}

// Скачивание презентации
function downloadMobilePresentation() {
    saveMobilePresentation().then(() => {
        const url = `/api.php?action=download_presentation&id=${presentationId}`;
        window.open(url, '_blank');
    });
}

// Поделиться презентацией или удалить публичную ссылку
function shareMobilePresentation() {
    const shareButton = document.getElementById('shareButton');
    const isPublic = shareButton.getAttribute('data-is-public') === '1';
    
    if (isPublic) {
        // Удаляем публичную ссылку
        if (!confirm('Вы уверены, что хотите удалить публичную ссылку? После этого презентация станет недоступна по ссылке.')) {
            return;
        }
        
        const presentationId = window.presentationId;
        if (!presentationId) {
            showMobileNotification('Ошибка: ID презентации не найден', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('presentation_id', presentationId);
        formData.append('enable', '0');
        formData.append('csrf_token', window.csrfToken);
        
        fetch('/api.php?action=toggle_public_link', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMobileNotification('Публичная ссылка удалена');
                
                // Обновляем глобальные переменные
                window.isPublic = false;
                window.publicUrl = '';
                
                // Обновляем кнопку
                shareButton.setAttribute('data-is-public', '0');
                shareButton.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.35C15.11 18.56 15.08 18.78 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" fill="currentColor"/>
                    </svg>
                    Поделиться
                `;
                
                // Синхронизируем с ПК версией
                if (typeof window.syncDesktopShareButton === 'function') {
                    window.syncDesktopShareButton(false, '');
                }
            } else {
                showMobileNotification('Ошибка: ' + (data.error || 'Неизвестная ошибка'), 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMobileNotification('Ошибка при выполнении запроса', 'error');
        });
    } else {
        // Создаем публичную ссылку
        saveMobilePresentation().then(() => {
            const presentationId = window.presentationId;
            if (!presentationId) {
                showMobileNotification('Ошибка: ID презентации не найден', 'error');
                return;
            }
            
            const formData = new FormData();
            formData.append('presentation_id', presentationId);
            formData.append('enable', '1');
            formData.append('csrf_token', window.csrfToken);
            
            fetch('/api.php?action=toggle_public_link', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.public_url) {
                    copyToClipboard(data.public_url);
                    showMobileNotification('Публичная ссылка создана и скопирована');
                    
                    // Обновляем глобальные переменные
                    window.isPublic = true;
                    window.publicUrl = data.public_url;
                    
                    // Обновляем кнопку
                    shareButton.setAttribute('data-is-public', '1');
                    shareButton.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                        </svg>
                        Удалить ссылку
                    `;
                    
                    // Синхронизируем с ПК версией
                    if (typeof window.syncDesktopShareButton === 'function') {
                        window.syncDesktopShareButton(true, data.public_url);
                    }
                } else {
                    showMobileNotification('Ошибка: ' + (data.error || 'Неизвестная ошибка'), 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMobileNotification('Ошибка при выполнении запроса', 'error');
            });
        });
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        // Fallback для старых браузеров
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

// Показ уведомления в мобильной версии
function showMobileNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `mobile-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Настройка обработчиков событий
function setupMobileEventListeners() {
    // Автосохранение при изменении полей
    document.addEventListener('input', function(e) {
        if (e.target.closest('.mob-editor__slide')) {
            hasUnsavedChanges = true;
            triggerAutoSave();
        }
    });
    
    // Предотвращение закрытия страницы с несохраненными изменениями
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите уйти?';
        }
    });
}

// Рендер списка метро для мобильной версии
function renderMetroListMobile(stations) {
    if (!stations || stations.length === 0) {
        return '<p style="color: #666; margin: 0;">Станции не найдены</p>';
    }
    
    let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
    stations.forEach(station => {
        html += `
            <div style="padding-bottom: 10px; border-bottom: 1px solid rgba(0,0,0,0.1);">
                <strong style="color: #1976d2; font-size: 14px;">${station.name}</strong><br>
                <span style="color: #666; font-size: 12px;">
                    <i class="fas fa-walking" style="width: 12px;"></i> ${station.walk_time_text} пешком
                    <br>
                    <i class="fas fa-car" style="width: 12px;"></i> ${station.drive_time_text} на авто
                    • ${station.distance_text}
                </span>
            </div>
        `;
    });
    html += '</div>';
    
    return html;
}

// Поиск ближайшего метро для мобильной версии
async function findNearestMetroMobile(slideIndex) {
    const slide = slides[slideIndex];
    const lat = slide.location_lat;
    const lng = slide.location_lng;
    
    if (!lat || !lng) {
        showMobileNotification('Сначала укажите адрес', 'error');
        return;
    }
    
    const metroInfo = document.getElementById(`mobile-metro-info-${slideIndex}`);
    const metroList = document.getElementById(`mobile-metro-list-${slideIndex}`);
    
    if (!metroList) return;
    
    metroList.innerHTML = '<div style="text-align: center; padding: 10px;"><i class="fas fa-spinner fa-spin"></i> Поиск станций метро...</div>';
    metroInfo.style.display = 'block';
    
    try {
        const formData = new FormData();
        formData.append('lat', lat);
        formData.append('lng', lng);
        formData.append('csrf_token', csrfToken);
        
        const response = await fetch('/api.php?action=find_nearest_metro', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success && data.stations) {
            slides[slideIndex].metro_stations = data.stations;
            if (slides[slideIndex].show_metro === undefined) {
                slides[slideIndex].show_metro = true;
            }
            
            metroList.innerHTML = renderMetroListMobile(data.stations);
            
            if (data.stations.length > 0) {
                showMobileNotification(`Найдено станций: ${data.stations.length}`, 'success');
            } else {
                metroList.innerHTML = '<p style="color: #666; margin: 0;">Станции метро не найдены поблизости</p>';
            }
            
            hasUnsavedChanges = true;
            triggerAutoSave();
        } else {
            throw new Error(data.error || 'Ошибка поиска метро');
        }
    } catch (error) {
        console.error('Ошибка поиска метро:', error);
        metroList.innerHTML = '<p style="color: #dc3545; margin: 0;"><i class="fas fa-exclamation-triangle"></i> Ошибка при поиске станций</p>';
        showMobileNotification('Ошибка при поиске станций метро', 'error');
    }
}

// Переключение видимости метро в презентации (мобильная версия)
function toggleMetroVisibilityMobile(slideIndex) {
    const checkbox = document.getElementById(`mobile-show-metro-${slideIndex}`);
    if (checkbox) {
        slides[slideIndex].show_metro = checkbox.checked;
        hasUnsavedChanges = true;
        triggerAutoSave();
        showMobileNotification(
            checkbox.checked ? 'Метро будет показано' : 'Метро будет скрыто',
            'success'
        );
    }
}

// Инициализация Яндекс карты для мобильного слайда
function initMobileYandexMap(slideIndex) {
    const slide = slides[slideIndex];
    const lat = slide.location_lat || 55.755864;
    const lng = slide.location_lng || 37.617698;
    const address = slide.location_address || 'Москва';
    
    const mapContainer = document.getElementById(`mobile-yandex-map-${slideIndex}`);
    const addressInput = document.getElementById(`mobile-location-address-${slideIndex}`);
    const latInput = document.getElementById(`mobile-location-lat-${slideIndex}`);
    const lngInput = document.getElementById(`mobile-location-lng-${slideIndex}`);
    
    if (!mapContainer || !addressInput) {
        console.warn(`Карта или поле ввода не найдены для мобильного слайда ${slideIndex}`);
        return;
    }
    
    if (typeof YandexMapsIntegration === 'undefined') {
        console.error('YandexMapsIntegration не загружен');
        mapContainer.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999;">Ошибка загрузки карты</div>';
        return;
    }
    
    const yandexMaps = new YandexMapsIntegration('0d3f02e3-3a2a-426d-a3a1-9952dcb199b9', 'editor');
    
    yandexMaps.initEditorMap(
        `mobile-yandex-map-${slideIndex}`,
        `mobile-location-address-${slideIndex}`,
        [parseFloat(lat), parseFloat(lng)]
    ).then(() => {
        console.log(`Мобильная карта успешно инициализирована для слайда ${slideIndex}`);
    }).catch(error => {
        console.error('Ошибка инициализации мобильной карты:', error);
        mapContainer.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #cc0000;">Ошибка загрузки карты</div>';
    });
    
    // Обработчик обновления координат с карты
    const locationUpdateHandler = (e) => {
        const currentAddress = document.getElementById(`mobile-location-address-${slideIndex}`);
        if (currentAddress && (document.activeElement === currentAddress || e.detail.address === currentAddress.value)) {
            if (latInput) latInput.value = e.detail.lat;
            if (lngInput) lngInput.value = e.detail.lng;
            
            if (slides[slideIndex]) {
                slides[slideIndex].location_lat = e.detail.lat;
                slides[slideIndex].location_lng = e.detail.lng;
                slides[slideIndex].location_address = e.detail.address;
                
                hasUnsavedChanges = true;
                if (typeof triggerAutoSave === 'function') {
                    triggerAutoSave();
                }
                
                console.log(`Мобильное местоположение обновлено для слайда ${slideIndex}:`, e.detail);
            }
        }
    };
    
    document.addEventListener('yandexMapLocationUpdate', locationUpdateHandler);
    
    // Обработчик изменения адреса вручную
    addressInput.addEventListener('blur', function() {
        if (slides[slideIndex]) {
            slides[slideIndex].location_address = this.value;
            hasUnsavedChanges = true;
            if (typeof triggerAutoSave === 'function') {
                triggerAutoSave();
            }
        }
    });
    
    // Сохраняем обработчик для очистки
    if (!window.mobileYandexMapHandlers) {
        window.mobileYandexMapHandlers = {};
    }
    window.mobileYandexMapHandlers[`slide-${slideIndex}`] = {
        handler: locationUpdateHandler,
        yandexMaps: yandexMaps
    };
}

// Инициализация карт для всех слайдов местоположения после рендера
function initAllMobileLocationMaps() {
    slides.forEach((slide, index) => {
        if (slide.type === 'location') {
            // Небольшая задержка для каждой карты
            setTimeout(() => {
                initMobileYandexMap(index);
            }, 300 * index);
        }
    });
}

// Переключение видимости валют в презентации (мобильная версия)
function toggleCurrenciesVisibilityMobile(slideIndex) {
    const checkbox = document.getElementById(`mobile-show-currencies-${slideIndex}`);
    if (checkbox) {
        slides[slideIndex].show_currencies = checkbox.checked;
        hasUnsavedChanges = true;
        triggerAutoSave();
        showMobileNotification(
            checkbox.checked ? 'Валюты будут показаны в презентации' : 'Валюты будут скрыты в презентации',
            'success'
        );
    }
}

// Конвертация HTML в текст для textarea (убираем теги, но сохраняем структуру)
function htmlToTextForTextarea(html) {
    if (!html) return '';
    
    // Если это уже текст без HTML, возвращаем как есть
    if (!html.includes('<') && !html.includes('&')) {
        return html;
    }
    
    let text = html;
    
    // Сначала заменяем <br> на переносы строк
    text = text.replace(/<br\s*\/?>/gi, '\n');
    
    // Убираем все HTML теги (включая экранированные)
    text = text.replace(/&lt;(\/?)([^&]+?)&gt;/gi, ''); // Экранированные теги &lt;strong&gt;
    text = text.replace(/<[^>]*>/g, ''); // Обычные теги <strong>
    
    // Декодируем HTML сущности через DOM
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Декодируем оставшиеся HTML сущности вручную
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&#x27;/g, "'");
    
    return text.trim();
}

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
    
    return html;
}

// Генерация текста с помощью AI (GigaChat) - мобильная версия
async function generateTextWithAI(slideIndex, type) {
    const slide = slides[slideIndex];
    if (!slide) {
        showMobileNotification('Слайд не найден', 'error');
        return;
    }
    
    // Находим поле для текста
    const contentField = document.querySelector(`[data-slide="${slideIndex}"][data-field="content"]`);
    if (!contentField) {
        showMobileNotification('Поле для текста не найдено', 'error');
        return;
    }
    
    const originalContent = contentField.value || '';
    const btn = event?.target?.closest('.mob-btn-generate-text');
    
    if (btn) {
        btn.classList.add('loading');
        btn.disabled = true;
    }
    
    contentField.value = 'Генерация текста с помощью AI...';
    contentField.disabled = true;
    contentField.style.opacity = '0.5';
    
    try {
        const formData = new FormData();
        formData.append('type', type);
        formData.append('prompt', originalContent || '');
        
        // Добавляем presentation_id если доступен
        const presentationId = (typeof window !== 'undefined' && window.presentationId) ? window.presentationId : '';
        if (presentationId) {
            formData.append('presentation_id', presentationId);
        }
        
        // Получаем CSRF токен
        const token = (typeof window !== 'undefined' && window.csrfToken) ? window.csrfToken : '';
        
        if (!token) {
            console.error('CSRF токен не найден!');
            showMobileNotification('Ошибка: CSRF токен не найден. Перезагрузите страницу.', 'error');
            if (btn) {
                btn.classList.remove('loading');
                btn.disabled = false;
            }
            contentField.disabled = false;
            contentField.style.opacity = '1';
            return;
        }
        
        formData.append('csrf_token', token);
        
        const response = await fetch('/api.php?action=generate_text', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (btn) {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
        
        contentField.disabled = false;
        contentField.style.opacity = '1';
        
        if (data.success && data.text) {
            // Конвертируем markdown в HTML
            const htmlContent = markdownToHtml(data.text);
            // Для textarea конвертируем HTML в читаемый текст
            const textForTextarea = htmlToTextForTextarea(htmlContent);
            contentField.value = textForTextarea;
            // Обновляем данные слайда (сохраняем HTML)
            slide.content = htmlContent;
            hasUnsavedChanges = true;
            triggerAutoSave();
            // Обновляем высоту textarea и показываем скролл если нужно
            if (typeof autoResizeTextarea === 'function') {
                autoResizeTextarea(contentField);
            } else {
                // Fallback: устанавливаем правильные стили для скролла
                contentField.style.height = 'auto';
                const scrollHeight = contentField.scrollHeight;
                const maxHeight = 500;
                if (scrollHeight > 268) {
                    contentField.style.height = Math.min(scrollHeight, maxHeight) + 'px';
                    contentField.style.overflowY = 'auto';
                } else {
                    contentField.style.height = '268px';
                    contentField.style.overflowY = 'hidden';
                }
            }
            showMobileNotification('Текст успешно сгенерирован!', 'success');
        } else {
            contentField.value = originalContent;
            const errorMsg = data.error || 'Неизвестная ошибка';
            
            // Если токен истек, предлагаем перезагрузить страницу
            if (errorMsg.includes('истек') || errorMsg.includes('токен')) {
                showMobileNotification(errorMsg + ' Перезагрузите страницу.', 'error');
            } else {
                showMobileNotification('Ошибка: ' + errorMsg, 'error');
            }
        }
    } catch (error) {
        if (btn) {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
        contentField.value = originalContent;
        contentField.disabled = false;
        contentField.style.opacity = '1';
        console.error('Ошибка генерации текста:', error);
        showMobileNotification('Ошибка соединения с сервером', 'error');
    }
}

// Подсказки адресов для мобильного редактора
var mobileAddressSuggestTimer = null;
var mobileAddressSuggestDropdown = null;

function initMobileAddressSuggestions() {
    document.addEventListener('input', function(e) {
        var input = e.target;
        if (!input.classList.contains('mobile-location-address-input') || !input.id) return;
        var match = input.id.match(/mobile-location-address-(\d+)/);
        var slideIndex = match ? parseInt(match[1], 10) : -1;
        if (slideIndex < 0) return;

        var q = (input.value || '').trim();
        clearTimeout(mobileAddressSuggestTimer);
        hideMobileAddressSuggestDropdown();

        if (q.length < 2) return;

        mobileAddressSuggestTimer = setTimeout(function() {
            fetch('/api.php?action=suggest&q=' + encodeURIComponent(q))
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    var list = data.suggestions || [];
                    if (list.length === 0) return;
                    showMobileAddressSuggestDropdown(input, list, slideIndex);
                })
                .catch(function() {});
        }, 300);
    }, true);

    document.addEventListener('click', function(e) {
        if (mobileAddressSuggestDropdown && !mobileAddressSuggestDropdown.contains(e.target)) {
            var input = document.querySelector('.mobile-location-address-input');
            if (!input || !input.contains(e.target)) hideMobileAddressSuggestDropdown();
        }
    });
}

function showMobileAddressSuggestDropdown(input, list, slideIndex) {
    hideMobileAddressSuggestDropdown();
    var wrap = document.createElement('div');
    wrap.className = 'mobile-address-suggest-dropdown';
    wrap.style.cssText = 'position:fixed;z-index:9999;background:#fff;border:1px solid #ddd;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.2);max-height:200px;overflow-y:auto;left:8px;right:8px;';
    list.forEach(function(item) {
        var display = item.display_name || item.address || '';
        var lat = item.lat != null ? item.lat : null;
        var lon = item.lon != null ? item.lon : item.lng;
        var el = document.createElement('div');
        el.textContent = display;
        el.style.cssText = 'padding:10px 12px;cursor:pointer;font-size:14px;border-bottom:1px solid #eee;';
        el.addEventListener('click', function() {
            input.value = display;
            var latInput = document.getElementById('mobile-location-lat-' + slideIndex);
            var lngInput = document.getElementById('mobile-location-lng-' + slideIndex);
            if (latInput && lat != null) latInput.value = lat;
            if (lngInput && lon != null) lngInput.value = lon;
            if (slides[slideIndex]) {
                slides[slideIndex].location_address = display;
                if (lat != null) slides[slideIndex].location_lat = lat;
                if (lon != null) slides[slideIndex].location_lng = lon;
            }
            hideMobileAddressSuggestDropdown();
            hasUnsavedChanges = true;
            triggerAutoSave();
            if (typeof initMobileYandexMap === 'function') initMobileYandexMap(slideIndex);
        });
        wrap.appendChild(el);
    });
    document.body.appendChild(wrap);
    mobileAddressSuggestDropdown = wrap;
    var rect = input.getBoundingClientRect();
    wrap.style.top = (rect.bottom + 4) + 'px';
    wrap.style.width = (document.documentElement.clientWidth - 16) + 'px';
}

function hideMobileAddressSuggestDropdown() {
    if (mobileAddressSuggestDropdown && mobileAddressSuggestDropdown.parentNode) {
        mobileAddressSuggestDropdown.parentNode.removeChild(mobileAddressSuggestDropdown);
    }
    mobileAddressSuggestDropdown = null;
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    if (window.innerWidth <= 767) {
        initMobileEditor();
        initMobileAddressSuggestions();
    }
});