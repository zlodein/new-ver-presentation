// Функции для работы с валютами

// Конвертация валют
async function convertPrice(slideIndex, fromCurrency, toCurrency) {
    const slide = slides[slideIndex];
    const amount = slide.price_value || 0;
    
    if (amount <= 0) return;
    
    try {
        const formData = new FormData();
        formData.append('amount', amount);
        formData.append('from', fromCurrency);
        formData.append('to', toCurrency);
        formData.append('is_rent', slide.deal_type === 'Аренда');
        formData.append('csrf_token', csrfToken);
        
        const response = await fetch('/api.php?action=convert_currency', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            slide.price_value = Math.round(data.converted);
            refreshSlide(slideIndex);
        }
    } catch (error) {
        console.error('Currency conversion error:', error);
    }
}

// Загрузка курсов валют
async function loadCurrencyRates() {
    try {
        const response = await fetch('/api.php?action=get_currency_rates');
        const data = await response.json();
        
        if (data.success) {
            currencyRates = data.rates;
            currencySymbols = data.symbols;
            
            slides.forEach((slide, index) => {
                if (slide.type === 'cover') {
                    updateCurrencyConversions(index);
                }
            });
        }
    } catch (error) {
        console.error('Failed to load currency rates:', error);
    }
}

// Обновление конвертации валют
async function updateCurrencyConversions(slideIndex) {
    const slide = slides[slideIndex];
    if (!slide) return;
    
    const amount = slide.price_value || 0;
    const baseCurrency = slide.currency || 'RUB';
    const isRent = slide.deal_type === 'Аренда';
    
    if (!currencyRates || amount <= 0) {
        console.log('Курсы валют не загружены или цена не указана', { currencyRates, amount });
        return;
    }
    
    // Обновляем блок со всеми валютами в редакторе (ПК версия)
    const editorAllCurrencies = document.getElementById(`editor-all-currencies-${slideIndex}`);
    if (editorAllCurrencies) {
        let htmlFull = '';
        const currencyNames = {
            'RUB': 'руб.',
            'USD': 'дол.',
            'EUR': 'евро',
            'CNY': 'юань',
            'KZT': 'тенге'
        };
        
        for (const [currency, rate] of Object.entries(currencyRates)) {
            if (currency === baseCurrency) continue;
            
            const converted = amount * (currencyRates[baseCurrency] / rate);
            const formatted = formatNumber(Math.round(converted));
            const symbol = currencySymbols[currency] || currency;
            const name = currencyNames[currency] || currency;
            
            htmlFull += `
                <div class="currency-item">
                    <span class="currency-value">${formatted}</span>
                    <span class="currency-symbol">${symbol}</span>
                    <span class="currency-name">${name}</span>
                    ${isRent ? '<span style="color: #999; margin-left: 3px; font-size: 10px;">/ мес.</span>' : ''}
                </div>
            `;
        }
        
        editorAllCurrencies.innerHTML = htmlFull;
    }
    
    // Обновляем блок со всеми валютами в мобильной версии
    const mobileAllCurrencies = document.getElementById(`mobile-all-currencies-${slideIndex}`);
    if (mobileAllCurrencies) {
        let htmlFull = '';
        const currencyNames = {
            'RUB': 'руб.',
            'USD': 'дол.',
            'EUR': 'евро',
            'CNY': 'юань',
            'KZT': 'тенге'
        };
        
        for (const [currency, rate] of Object.entries(currencyRates)) {
            if (currency === baseCurrency) continue;
            
            const converted = amount * (currencyRates[baseCurrency] / rate);
            const formatted = formatNumber(Math.round(converted));
            const symbol = currencySymbols[currency] || currency;
            const name = currencyNames[currency] || currency;
            
            htmlFull += `
                <div style="background: #f8f9fa; padding: 8px 12px; border-radius: 6px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; font-size: 13px; border: 1px solid #e0e0e0;">
                    <span style="font-weight: bold; color: var(--theme-main-color); font-size: 14px;">${formatted}</span>
                    <span style="font-weight: bold; font-size: 14px;">${symbol}</span>
                    <span style="font-size: 11px; color: #666;">${name}</span>
                    ${isRent ? '<span style="color: #999; font-size: 11px; margin-left: 3px;">/ мес.</span>' : ''}
                </div>
            `;
        }
        
        mobileAllCurrencies.innerHTML = htmlFull;
    }
}

// Переключение видимости валют в презентации (ПК версия)
function toggleCurrenciesVisibility(slideIndex) {
    const checkbox = document.getElementById(`show-currencies-${slideIndex}`);
    if (checkbox) {
        slides[slideIndex].show_currencies = checkbox.checked;
        hasUnsavedChanges = true;
        triggerAutoSave();
        showNotification(
            checkbox.checked ? 'Валюты будут показаны в презентации' : 'Валюты будут скрыты в презентации',
            'success'
        );
    }
}

// Обновление курсов валют
async function refreshCurrencyRates() {
    try {
        const response = await fetch('/api.php?action=get_currency_rates&force=true');
        const data = await response.json();
        
        if (data.success) {
            currencyRates = data.rates;
            showNotification('Курсы валют обновлены', 'success');
            
            slides.forEach((slide, index) => {
                if (slide.type === 'cover') {
                    updateCurrencyConversions(index);
                }
            });
        }
    } catch (error) {
        console.error('Failed to refresh currency rates:', error);
        showNotification('Ошибка обновления курсов', 'error');
    }
}