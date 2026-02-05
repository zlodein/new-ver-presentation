// Инициализация цветовой темы
function initThemeColor() {
    applyThemeColor(currentThemeColor);
    
    const colorPicker = document.getElementById('themeColorPicker');
    if (colorPicker) {
        colorPicker.value = currentThemeColor;
        colorPicker.addEventListener('change', function(e) {
            applyThemeColor(e.target.value);
        });
    }
}

// Применение цвета темы
function applyThemeColor(color) {
    currentThemeColor = color;
    document.documentElement.style.setProperty('--theme-main-color', color);
    
    document.querySelectorAll('.booklet-main__img, .booklet-char__top-square, .booklet-char__bottom-square, .booklet-img__top-square, .booklet-img__bottom-square, .booklet-galery__top-square, .booklet-galery__bottom-square, .booklet-grid__top-square, .booklet-grid__bottom-square').forEach(el => {
        el.style.backgroundColor = color;
    });
    
    hasUnsavedChanges = true;
    triggerAutoSave();
}

// Отслеживание активности пользователя
function initActivityTracking() {
    ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(event => {
        document.addEventListener(event, () => {
            lastActivityTime = Date.now();
            clearTimeout(idleTimer);
            
            idleTimer = setTimeout(() => {
                const idleTime = Date.now() - lastActivityTime;
                if (idleTime >= IDLE_SAVE_DELAY && hasUnsavedChanges) {
                    savePresentation(true, 'draft');
                    showNotification('Автосохранение после бездействия', 'success');
                }
            }, IDLE_SAVE_DELAY);
        }, { passive: true });
    });
    
    setInterval(() => {
        const idleTime = Date.now() - lastActivityTime;
        if (idleTime >= IDLE_SAVE_DELAY && hasUnsavedChanges) {
            savePresentation(true, 'draft');
            showNotification('Автосохранение после бездействия', 'success');
        }
    }, 60000);
}

// Инициализация автосохранения
function initAutoSave() {
    document.addEventListener('input', function(e) {
        if (e.target.closest('[contenteditable="true"]')) {
            hasUnsavedChanges = true;
            triggerAutoSave();
        }
    });
    
    const titleInput = document.getElementById('presentationTitle');
    if (titleInput) {
        titleInput.addEventListener('input', function() {
            hasUnsavedChanges = true;
            triggerAutoSave();
        });
    }
    
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите уйти?';
            return 'У вас есть несохраненные изменения. Вы уверены, что хотите уйти?';
        }
    });
}

// Обработчики вставки текста
function initPasteHandlers() {
    document.addEventListener('paste', function(e) {
        const target = e.target;
        if (target.classList.contains('editor-field')) {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
            const event = new Event('input', { bubbles: true });
            target.dispatchEvent(event);
        }
    });
}

// Инициализация полей цен
function initPriceFields() {
    slides.forEach((slide, index) => {
        if (slide.type === 'cover') {
            if (!slide.price_value && slide.price) {
                const priceMatch = slide.price.match(/([\d\s]+)/);
                if (priceMatch) {
                    slide.price_value = parseFormattedNumber(priceMatch[1]);
                } else {
                    slide.price_value = 1000000;
                }
            }
            
            if (!slide.currency) {
                slide.currency = 'RUB';
            }
            
            if (!slide.deal_type) {
                slide.deal_type = 'Аренда';
            }
        }
    });
}

// Просмотр презентации
function previewPresentation() {
    savePresentation(false, 'draft').then(() => {
        window.open(`/api.php?action=generate_presentation&id=${presentationId}`, '_blank');
    });
}

// Инициализация темы оформления
function initThemeStyle() {
    // Применяем текущую тему при загрузке
    if (typeof currentThemeStyle !== 'undefined') {
        applyThemeStyle(currentThemeStyle);
    } else {
        applyThemeStyle('classic');
    }
    
    // Применяем дополнительные настройки кастомизации
    if (typeof applyCustomization === 'function') {
        applyCustomization();
    }
}

// Подсказки адресов при вводе местоположения
let addressSuggestTimer = null;
let addressSuggestDropdown = null;

function initAddressSuggestions() {
    document.addEventListener('input', function(e) {
        const input = e.target;
        if (!input.classList.contains('location-address-input') || !input.id) return;
        const match = input.id.match(/location-address-(\d+)/);
        const slideIndex = match ? parseInt(match[1], 10) : -1;
        if (slideIndex < 0) return;

        const q = (input.value || '').trim();
        clearTimeout(addressSuggestTimer);
        hideAddressSuggestDropdown();

        if (q.length < 2) return;

        addressSuggestTimer = setTimeout(function() {
            fetch('/api.php?action=suggest&q=' + encodeURIComponent(q))
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    const list = data.suggestions || [];
                    if (list.length === 0) return;
                    showAddressSuggestDropdown(input, list, slideIndex);
                })
                .catch(function() {});
        }, 300);
    }, true);

    document.addEventListener('focusin', function(e) {
        if (e.target.classList.contains('location-address-input') && (e.target.value || '').trim().length >= 2) {
            const q = (e.target.value || '').trim();
            fetch('/api.php?action=suggest&q=' + encodeURIComponent(q))
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    const list = data.suggestions || [];
                    if (list.length === 0) return;
                    const match = e.target.id.match(/location-address-(\d+)/);
                    const slideIndex = match ? parseInt(match[1], 10) : -1;
                    if (slideIndex >= 0) showAddressSuggestDropdown(e.target, list, slideIndex);
                })
                .catch(function() {});
        }
    });

    document.addEventListener('click', function(e) {
        if (addressSuggestDropdown && !addressSuggestDropdown.contains(e.target)) {
            const input = document.querySelector('.location-address-input');
            if (!input || !input.contains(e.target)) hideAddressSuggestDropdown();
        }
    });
}

function showAddressSuggestDropdown(input, list, slideIndex) {
    hideAddressSuggestDropdown();
    var wrap = document.createElement('div');
    wrap.className = 'address-suggest-dropdown';
    wrap.style.cssText = 'position:absolute;z-index:9999;background:#fff;border:1px solid #ddd;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.15);max-height:240px;overflow-y:auto;min-width:200px;';
    list.forEach(function(item) {
        var display = item.display_name || item.address || '';
        var lat = item.lat != null ? item.lat : null;
        var lon = item.lon != null ? item.lon : item.lng;
        var el = document.createElement('div');
        el.className = 'address-suggest-item';
        el.textContent = display;
        el.style.cssText = 'padding:8px 12px;cursor:pointer;font-size:13px;border-bottom:1px solid #eee;';
        el.addEventListener('mouseenter', function() { this.style.background = '#f5f5f5'; });
        el.addEventListener('mouseleave', function() { this.style.background = ''; });
        el.addEventListener('click', function() {
            input.value = display;
            var latInput = document.getElementById('location-lat-' + slideIndex);
            var lngInput = document.getElementById('location-lng-' + slideIndex);
            if (latInput && lat != null) latInput.value = lat;
            if (lngInput && lon != null) lngInput.value = lon;
            if (slides[slideIndex]) {
                slides[slideIndex].location_address = display;
                if (lat != null) slides[slideIndex].location_lat = lat;
                if (lon != null) slides[slideIndex].location_lng = lon;
            }
            hideAddressSuggestDropdown();
            hasUnsavedChanges = true;
            triggerAutoSave();
            var ev = new CustomEvent('yandexMapLocationUpdate', { detail: { lat: lat, lng: lon, address: display } });
            document.dispatchEvent(ev);
        });
        wrap.appendChild(el);
    });
    document.body.appendChild(wrap);
    addressSuggestDropdown = wrap;
    var rect = input.getBoundingClientRect();
    wrap.style.top = (rect.bottom + window.scrollY + 4) + 'px';
    wrap.style.left = rect.left + 'px';
    wrap.style.width = Math.max(rect.width, 280) + 'px';
}

function hideAddressSuggestDropdown() {
    if (addressSuggestDropdown && addressSuggestDropdown.parentNode) {
        addressSuggestDropdown.parentNode.removeChild(addressSuggestDropdown);
    }
    addressSuggestDropdown = null;
}

// Основная инициализация
document.addEventListener('DOMContentLoaded', function() {
    initSlideGenerators();
    initSwiper();
    initThemeColor();
    initThemeStyle();
    initAutoSave();
    initActivityTracking();
    initPasteHandlers();
    initPriceFields();
    initAddressSuggestions();
    loadCurrencyRates();
});