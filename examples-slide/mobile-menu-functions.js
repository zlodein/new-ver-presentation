// Функции управления выпадающим меню для мобильной версии

// Открыть выпадающее меню
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenuDropdown');
    if (menu) {
        menu.classList.toggle('open');
        if (menu.classList.contains('open')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

// Открыть настройки оформления (мобильная версия)
function toggleMobileSettings() {
    console.log('toggleMobileSettings called');
    const settingsModal = document.getElementById('mobSettingsModal');
    console.log('settingsModal:', settingsModal);
    if (settingsModal) {
        settingsModal.classList.toggle('open');
        if (settingsModal.classList.contains('open')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    } else {
        console.error('mobSettingsModal not found!');
    }
}

// Делаем функцию глобально доступной
window.toggleMobileSettings = toggleMobileSettings;

// Закрыть настройки оформления
function closeMobileSettings() {
    const settingsModal = document.getElementById('mobSettingsModal');
    if (settingsModal) {
        settingsModal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// Закрыть выпадающее меню
function closeMobileMenu() {
    const menu = document.getElementById('mobileMenuDropdown');
    if (menu) {
        menu.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// Открыть модальное окно добавления слайда
function openAddSlideModal() {
    closeMobileMenu();
    const modal = document.getElementById('mobAddSlideModal');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

// Закрыть модальное окно добавления слайда
function closeAddSlideModal() {
    const modal = document.getElementById('mobAddSlideModal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// Добавить слайд определенного типа - ПРЯМАЯ РЕАЛИЗАЦИЯ
function addSlideOfType(slideType) {
    closeAddSlideModal();
    
    console.log('addSlideOfType called with:', slideType);
    console.log('defaultSlides:', typeof defaultSlides !== 'undefined' ? 'exists' : 'undefined');
    console.log('slides:', typeof slides !== 'undefined' ? slides.length : 'undefined');
    console.log('currentSlideIndex:', typeof currentSlideIndex !== 'undefined' ? currentSlideIndex : 'undefined');
    
    // Проверяем наличие необходимых переменных
    if (typeof slides === 'undefined') {
        alert('Ошибка: массив slides не определен');
        return;
    }
    
    if (typeof defaultSlides === 'undefined') {
        alert('Ошибка: объект defaultSlides не определен');
        return;
    }
    
    if (!defaultSlides[slideType]) {
        alert('Ошибка: шаблон для типа "' + slideType + '" не найден');
        return;
    }
    
    try {
        // Создаем новый слайд из шаблона
        let newSlide = JSON.parse(JSON.stringify(defaultSlides[slideType]));
        console.log('Created new slide:', newSlide);
        
        // Если это слайд контактов, загружаем данные из профиля
        if (slideType === 'contacts') {
            (async () => {
                try {
                    const response = await fetch('/api.php?action=get_profile_for_presentation', {
                        method: 'GET',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        credentials: 'same-origin'
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.data) {
                            const profileData = data.data;
                            
                            // Заполняем данные из профиля, если они есть
                            if (profileData.avatar) {
                                newSlide.avatar = profileData.avatar;
                            }
                            if (profileData.name) {
                                newSlide.contact_name = profileData.name;
                            }
                            if (profileData.role) {
                                newSlide.contact_role = profileData.role;
                            }
                            if (profileData.phone) {
                                newSlide.contact_phone = profileData.phone;
                            }
                            if (profileData.messengers) {
                                newSlide.contact_messengers = profileData.messengers;
                            }
                            
                            // Обновляем слайд в массиве
                            slides[insertIndex] = newSlide;
                            
                            // Перерисовываем слайды
                            if (typeof renderMobileSlides === 'function') {
                                renderMobileSlides();
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error loading profile data:', error);
                }
            })();
        }
        
        // Определяем позицию для вставки
        let insertIndex;
        if (typeof currentSlideIndex !== 'undefined' && currentSlideIndex >= 0) {
            insertIndex = currentSlideIndex + 1;
        } else if (typeof mobEditorSwiper !== 'undefined' && mobEditorSwiper) {
            insertIndex = mobEditorSwiper.activeIndex + 1;
        } else {
            insertIndex = slides.length;
        }
        
        console.log('Insert index:', insertIndex);
        
        // Добавляем слайд
        slides.splice(insertIndex, 0, newSlide);
        console.log('Slide added. Total slides:', slides.length);
        
        // Обновляем навигацию
        if (typeof renderMobileNavigation === 'function') {
            console.log('Calling renderMobileNavigation');
            renderMobileNavigation();
        }
        
        // Обновляем слайды
        if (typeof renderMobileSlides === 'function') {
            console.log('Calling renderMobileSlides');
            renderMobileSlides();
        }
        
        // Обновляем Swiper
        if (typeof mobEditorSwiper !== 'undefined' && mobEditorSwiper) {
            console.log('Updating mobEditorSwiper');
            mobEditorSwiper.update();
        }
        
        if (typeof mobNavSwiper !== 'undefined' && mobNavSwiper) {
            console.log('Updating mobNavSwiper');
            mobNavSwiper.update();
        }
        
        // Обновляем кнопки
        if (typeof updateButtons === 'function') {
            updateButtons();
        }
        
        // Переходим на новый слайд
        setTimeout(() => {
            console.log('Switching to slide:', insertIndex);
            if (typeof switchToSlide === 'function') {
                switchToSlide(insertIndex);
            } else if (mobEditorSwiper) {
                mobEditorSwiper.slideTo(insertIndex);
            }
            
            if (typeof updateButtons === 'function') {
                updateButtons();
            }
            
            // Если было только одно слайд, а теперь больше - обновляем навигацию для показа стрелок
            if (typeof renderMobileNavigation === 'function') {
                renderMobileNavigation();
            }
            
            // Сохраняем изменения после всех обновлений
            if (typeof hasUnsavedChanges !== 'undefined') {
                hasUnsavedChanges = true;
            }
            
            // Автосохранение немедленно после добавления слайда
            if (typeof triggerAutoSave === 'function') {
                triggerAutoSave();
            } else if (typeof savePresentation === 'function') {
                // Fallback: прямое сохранение если triggerAutoSave недоступен
                savePresentation(true, 'draft');
            }
        }, 100);
        
        // Показываем уведомление
        if (typeof showMobileNotification === 'function') {
            showMobileNotification('Слайд добавлен');
        } else {
            alert('Слайд добавлен');
        }
        
        console.log('addSlideOfType completed successfully');
        
    } catch (error) {
        console.error('Error in addSlideOfType:', error);
        alert('Ошибка при добавлении слайда: ' + error.message);
    }
}

// Удалить текущий слайд
function deleteCurrentSlide() {
    closeMobileMenu();
    
    if (typeof deleteMobileSlide === 'function') {
        deleteMobileSlide();
        return;
    }
    
    if (typeof slides === 'undefined' || typeof mobEditorSwiper === 'undefined') {
        showMobileNotification('Ошибка удаления', 'error');
        return;
    }
    
    if (slides.length <= 1) {
        showMobileNotification('Нельзя удалить единственный слайд', 'error');
        return;
    }
    
    if (!confirm('Вы уверены, что хотите удалить этот слайд?')) {
        return;
    }
    
    const currentIndex = mobEditorSwiper.activeIndex;
    slides.splice(currentIndex, 1);
    
    // Используем новую функцию удаления из навигации
    if (typeof deleteSlideInNav === 'function') {
        deleteSlideInNav(currentIndex);
        return;
    }
    
    if (typeof renderMobileNavigation === 'function') {
        renderMobileNavigation();
    }
    
    if (typeof renderMobileSlides === 'function') {
        renderMobileSlides();
    }
    
    if (mobEditorSwiper) {
        mobEditorSwiper.update();
    }
    
    if (typeof mobNavSwiper !== 'undefined' && mobNavSwiper) {
        mobNavSwiper.update();
    }
    
    const newIndex = Math.min(currentIndex, slides.length - 1);
    setTimeout(() => {
        if (typeof switchToSlide === 'function') {
            switchToSlide(newIndex);
        }
        if (typeof updateButtons === 'function') {
            updateButtons();
        }
    }, 100);
    
    if (typeof hasUnsavedChanges !== 'undefined') {
        hasUnsavedChanges = true;
    }
    
    showMobileNotification('Слайд удален');
    
    // Автосохранение немедленно после удаления
    if (typeof triggerAutoSave === 'function') {
        triggerAutoSave();
    } else if (typeof savePresentation === 'function') {
        // Fallback: прямое сохранение если triggerAutoSave недоступен
        savePresentation(true, 'draft');
    }
}

// Переместить слайд назад
function moveSlideBackward() {
    closeMobileMenu();
    
    if (typeof moveSlideMobileLeft === 'function') {
        moveSlideMobileLeft();
        return;
    }
    
    if (typeof slides === 'undefined' || typeof mobEditorSwiper === 'undefined') {
        showMobileNotification('Ошибка перемещения', 'error');
        return;
    }
    
    const currentIndex = mobEditorSwiper.activeIndex;
    
    if (currentIndex === 0) {
        showMobileNotification('Слайд уже первый', 'error');
        return;
    }
    
    // Используем новую функцию перемещения из навигации
    if (typeof moveSlideInNav === 'function') {
        moveSlideInNav(currentIndex, -1);
        return;
    }
    
    const temp = slides[currentIndex];
    slides[currentIndex] = slides[currentIndex - 1];
    slides[currentIndex - 1] = temp;
    
    if (typeof renderMobileNavigation === 'function') {
        renderMobileNavigation();
    }
    
    if (typeof renderMobileSlides === 'function') {
        renderMobileSlides();
    }
    
    if (mobEditorSwiper) {
        mobEditorSwiper.update();
    }
    
    if (typeof mobNavSwiper !== 'undefined' && mobNavSwiper) {
        mobNavSwiper.update();
    }
    
    setTimeout(() => {
        if (typeof switchToSlide === 'function') {
            switchToSlide(currentIndex - 1);
        }
        if (typeof updateButtons === 'function') {
            updateButtons();
        }
    }, 100);
    
    if (typeof hasUnsavedChanges !== 'undefined') {
        hasUnsavedChanges = true;
    }
    
    showMobileNotification('Слайд перемещен назад');
    
    // Автосохранение немедленно после перемещения
    if (typeof triggerAutoSave === 'function') {
        triggerAutoSave();
    } else if (typeof savePresentation === 'function') {
        // Fallback: прямое сохранение если triggerAutoSave недоступен
        savePresentation(true, 'draft');
    }
}

// Переместить слайд вперед
function moveSlideForward() {
    closeMobileMenu();
    
    if (typeof moveSlideMobileRight === 'function') {
        moveSlideMobileRight();
        return;
    }
    
    if (typeof slides === 'undefined' || typeof mobEditorSwiper === 'undefined') {
        showMobileNotification('Ошибка перемещения', 'error');
        return;
    }
    
    const currentIndex = mobEditorSwiper.activeIndex;
    
    if (currentIndex === slides.length - 1) {
        showMobileNotification('Слайд уже последний', 'error');
        return;
    }
    
    // Используем новую функцию перемещения из навигации
    if (typeof moveSlideInNav === 'function') {
        moveSlideInNav(currentIndex, 1);
        return;
    }
    
    const temp = slides[currentIndex];
    slides[currentIndex] = slides[currentIndex + 1];
    slides[currentIndex + 1] = temp;
    
    if (typeof renderMobileNavigation === 'function') {
        renderMobileNavigation();
    }
    
    if (typeof renderMobileSlides === 'function') {
        renderMobileSlides();
    }
    
    if (mobEditorSwiper) {
        mobEditorSwiper.update();
    }
    
    if (typeof mobNavSwiper !== 'undefined' && mobNavSwiper) {
        mobNavSwiper.update();
    }
    
    setTimeout(() => {
        if (typeof switchToSlide === 'function') {
            switchToSlide(currentIndex + 1);
        }
        if (typeof updateButtons === 'function') {
            updateButtons();
        }
    }, 100);
    
    if (typeof hasUnsavedChanges !== 'undefined') {
        hasUnsavedChanges = true;
    }
    
    showMobileNotification('Слайд перемещен вперед');
    
    // Автосохранение немедленно после перемещения
    if (typeof triggerAutoSave === 'function') {
        triggerAutoSave();
    } else if (typeof savePresentation === 'function') {
        // Fallback: прямое сохранение если triggerAutoSave недоступен
        savePresentation(true, 'draft');
    }
}

// Переключить отображение валют
function toggleCurrencyDisplay() {
    closeMobileMenu();
    
    const checkbox = document.getElementById('showAllCurrencies');
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
        
        const event = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(event);
        
        const menuText = document.getElementById('currencyToggleText');
        if (menuText) {
            menuText.textContent = checkbox.checked ? 'Скрыть валюты' : 'Показывать валюты в презентации';
        }
        
        showMobileNotification(
            checkbox.checked ? 'Все валюты будут показаны' : 'Будет показана только основная валюта'
        );
        
        if (typeof hasUnsavedChanges !== 'undefined') {
            hasUnsavedChanges = true;
        }
        
        if (typeof triggerAutoSave === 'function') {
            setTimeout(() => triggerAutoSave(), 500);
        }
    }
}

// Открыть выбор цвета темы
function openThemeColorPicker() {
    closeMobileMenu();
    
    const colorPicker = document.getElementById('themeColorPicker');
    if (colorPicker) {
        colorPicker.click();
    }
}

// Очистить поля текущего слайда
function clearCurrentSlide() {
    closeMobileMenu();
    
    if (typeof slides === 'undefined' || typeof mobEditorSwiper === 'undefined') {
        showMobileNotification('Ошибка очистки', 'error');
        return;
    }
    
    if (!confirm('Вы уверены, что хотите очистить все поля слайда?')) {
        return;
    }
    
    const currentIndex = mobEditorSwiper.activeIndex;
    const currentSlide = slides[currentIndex];
    const slideType = currentSlide.type;
    
    if (typeof defaultSlides !== 'undefined' && defaultSlides[slideType]) {
        slides[currentIndex] = JSON.parse(JSON.stringify(defaultSlides[slideType]));
    } else {
        slides[currentIndex] = { type: slideType, hidden: false };
    }
    
    if (typeof renderMobileSlides === 'function') {
        renderMobileSlides();
    }
    
    if (mobEditorSwiper) {
        mobEditorSwiper.update();
        
        setTimeout(() => {
            mobEditorSwiper.slideTo(currentIndex);
            if (typeof updateNavigation === 'function') {
                updateNavigation();
            }
        }, 100);
    }
    
    if (typeof hasUnsavedChanges !== 'undefined') {
        hasUnsavedChanges = true;
    }
    
    showMobileNotification('Поля очищены');
    
    if (typeof triggerAutoSave === 'function') {
        setTimeout(() => triggerAutoSave(), 500);
    }
}

// Показать уведомление
function showMobileNotification(message, type = 'success') {
    const existing = document.querySelector('.mobile-notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `mobile-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('mobile-menu-functions.js loaded');
    console.log('defaultSlides available:', typeof defaultSlides !== 'undefined');
    console.log('slides available:', typeof slides !== 'undefined');
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMobileMenu();
            closeAddSlideModal();
            closeMobileSettings();
        }
    });
    
    // Обработчик для цветовой палитры в мобильных настройках
    const mobileColorPicker = document.getElementById('mobileThemeColorPicker');
    if (mobileColorPicker) {
        mobileColorPicker.addEventListener('change', function() {
            const color = this.value;
            document.documentElement.style.setProperty('--theme-main-color', color);
            if (typeof window !== 'undefined') {
                window.currentThemeColor = color;
            }
            showMobileNotification('Цвет темы изменен');
            
            if (typeof hasUnsavedChanges !== 'undefined') {
                hasUnsavedChanges = true;
            }
            
            if (typeof triggerAutoSave === 'function') {
                setTimeout(() => triggerAutoSave(), 500);
            }
        });
    }
    
    // Обработчики для кнопок стилей темы
    document.querySelectorAll('.mob-theme-style-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const theme = this.dataset.theme;
            
            // Убираем active со всех кнопок
            document.querySelectorAll('.mob-theme-style-btn').forEach(b => b.classList.remove('active'));
            // Добавляем active к текущей
            this.classList.add('active');
            
            // Применяем стиль темы
            if (typeof applyThemeStyle === 'function') {
                applyThemeStyle(theme);
            } else if (typeof window !== 'undefined' && window.applyThemeStyle) {
                window.applyThemeStyle(theme);
            }
            
            showMobileNotification('Стиль темы изменен');
            
            if (typeof hasUnsavedChanges !== 'undefined') {
                hasUnsavedChanges = true;
            }
            
            if (typeof triggerAutoSave === 'function') {
                setTimeout(() => triggerAutoSave(), 500);
            }
        });
    });
    
    // Обработчики для кнопок формы декоративных элементов
    document.querySelectorAll('.mob-decoration-shape-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const shape = this.dataset.shape;
            
            // Убираем active со всех кнопок
            document.querySelectorAll('.mob-decoration-shape-btn').forEach(b => b.classList.remove('active'));
            // Добавляем active к текущей
            this.classList.add('active');
            
            // Применяем форму
            if (typeof applyDecorationShape === 'function') {
                applyDecorationShape(shape);
            }
            
            showMobileNotification('Форма декоративных элементов изменена');
            
            if (typeof hasUnsavedChanges !== 'undefined') {
                hasUnsavedChanges = true;
            }
            
            if (typeof triggerAutoSave === 'function') {
                setTimeout(() => triggerAutoSave(), 500);
            }
        });
    });
    
    // Обработчики для чекбоксов декоративных элементов
    const mobShowTop = document.getElementById('mobShowTopDecorations');
    const mobShowBottom = document.getElementById('mobShowBottomDecorations');
    
    if (mobShowTop) {
        mobShowTop.addEventListener('change', function() {
            if (typeof showTopDecorations !== 'undefined') {
                window.showTopDecorations = this.checked;
            }
            if (typeof applyDecorationVisibility === 'function') {
                applyDecorationVisibility();
            }
            
            if (typeof hasUnsavedChanges !== 'undefined') {
                hasUnsavedChanges = true;
            }
            
            if (typeof triggerAutoSave === 'function') {
                setTimeout(() => triggerAutoSave(), 500);
            }
        });
    }
    
    if (mobShowBottom) {
        mobShowBottom.addEventListener('change', function() {
            if (typeof showBottomDecorations !== 'undefined') {
                window.showBottomDecorations = this.checked;
            }
            if (typeof applyDecorationVisibility === 'function') {
                applyDecorationVisibility();
            }
            
            if (typeof hasUnsavedChanges !== 'undefined') {
                hasUnsavedChanges = true;
            }
            
            if (typeof triggerAutoSave === 'function') {
                setTimeout(() => triggerAutoSave(), 500);
            }
        });
    }
    
    // Обработчики для селектов кастомизации
    const mobHeadingFontSize = document.getElementById('mobHeadingFontSize');
    const mobTextFontSize = document.getElementById('mobTextFontSize');
    const mobFontStyle = document.getElementById('mobFontStyle');
    const mobLineHeight = document.getElementById('mobLineHeight');
    const mobSpacing = document.getElementById('mobSpacing');
    
    [mobHeadingFontSize, mobTextFontSize, mobFontStyle, mobLineHeight, mobSpacing].forEach(select => {
        if (select) {
            select.addEventListener('change', function() {
                const field = this.id.replace('mob', '').replace(/([A-Z])/g, '_$1').toLowerCase();
                const value = this.value;
                
                // Обновляем глобальные переменные
                if (field === 'heading_font_size' && typeof headingFontSize !== 'undefined') {
                    window.headingFontSize = value;
                } else if (field === 'text_font_size' && typeof textFontSize !== 'undefined') {
                    window.textFontSize = value;
                } else if (field === 'font_style' && typeof fontStyle !== 'undefined') {
                    window.fontStyle = value;
                } else if (field === 'line_height' && typeof lineHeight !== 'undefined') {
                    window.lineHeight = value;
                } else if (field === 'spacing' && typeof spacing !== 'undefined') {
                    window.spacing = value;
                }
                
                // Применяем кастомизацию
                if (typeof applyCustomization === 'function') {
                    applyCustomization();
                }
                
                showMobileNotification('Настройка изменена');
                
                if (typeof hasUnsavedChanges !== 'undefined') {
                    hasUnsavedChanges = true;
                }
                
                if (typeof triggerAutoSave === 'function') {
                    setTimeout(() => triggerAutoSave(), 500);
                }
            });
        }
    });
});