// Управление слайдами
function moveSlide(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= slides.length) return;
    
    [slides[index], slides[newIndex]] = [slides[newIndex], slides[index]];
    
    renderSlides();
    swiper.destroy();
    initSwiper();
    swiper.slideTo(newIndex);
    
    hasUnsavedChanges = true;
    triggerAutoSave();
}

// Переключение видимости слайда
function toggleSlideVisibility(index) {
    slides[index].hidden = !slides[index].hidden;
    refreshSlide(index);
    hasUnsavedChanges = true;
    triggerAutoSave();
}

// Дублирование слайда
function duplicateSlide(index) {
    const newSlide = JSON.parse(JSON.stringify(slides[index]));
    slides.splice(index + 1, 0, newSlide);
    
    renderSlides();
    swiper.destroy();
    initSwiper();
    swiper.slideTo(index + 1);
    
    hasUnsavedChanges = true;
    triggerAutoSave();
}

// Удаление слайда
function deleteSlide(index) {
    if (slides.length === 1) {
        alert('Нельзя удалить последний слайд');
        return;
    }
    
    if (confirm('Удалить этот слайд?')) {
        slides.splice(index, 1);
        renderSlides();
        swiper.destroy();
        initSwiper();
        hasUnsavedChanges = true;
        triggerAutoSave();
    }
}

// Открытие диалога добавления слайда (для обратной совместимости, если вызывается из JS)
function showAddSlideDialog() {
    const modal = document.getElementById('addSlideModal');
    if (modal) {
        // Используем Bootstrap Modal через data-атрибуты
        const trigger = document.querySelector('[data-bs-target="#addSlideModal"]');
        if (trigger) {
            trigger.click();
        }
    }
}

// Закрытие диалога добавления слайда (для обратной совместимости)
function closeAddSlideDialog() {
    const modal = document.getElementById('addSlideModal');
    if (modal) {
        const closeBtn = modal.querySelector('[data-bs-dismiss="modal"]');
        if (closeBtn) {
            closeBtn.click();
        }
    }
}

// Добавление слайда определенного типа
async function addSlideOfType(type) {
    const newSlide = defaultSlides[type] || { type: type, hidden: false };
    
    // Если это слайд контактов, загружаем данные из профиля
    if (type === 'contacts') {
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
                }
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
            // Продолжаем с дефолтными значениями при ошибке
        }
    }
    
    slides.push(newSlide);
    
    renderSlides();
    if (swiper) swiper.destroy();
    initSwiper();
    swiper.slideTo(slides.length - 1);
    
    closeAddSlideDialog();
    hasUnsavedChanges = true;
    triggerAutoSave();
}

// Функции для работы с индикатором сохранения
function updateSaveIndicator(state, message) {
    const saveIndicator = document.getElementById('saveIndicator');
    const saveText = document.getElementById('saveText');
    
    if (saveIndicator && saveText) {
        saveIndicator.style.display = 'block';
        saveIndicator.className = `save-indicator ${state}`;
        saveText.innerHTML = message;
        
        if (state === 'saved' || state === 'error') {
            setTimeout(() => {
                saveIndicator.style.display = 'none';
            }, state === 'saved' ? 2500 : 3000);
        }
    }
}

// Загрузка файла
async function handleFileUpload(file, inputElement) {
    if (!file) return { success: false, error: 'Файл не выбран' };
    
    const slideIndex = parseInt(inputElement.dataset.slide);
    const uploadType = inputElement.dataset.uploadType;
    const position = parseInt(inputElement.dataset.position);
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('presentation_id', presentationId);
    formData.append('csrf_token', csrfToken);
    
    // Показываем индикатор загрузки
    updateSaveIndicator('saving', 'Загрузка изображения...');
    
    try {
        const response = await fetch('/api.php?action=upload_image', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.url) {
            // Обновляем данные слайда
            if (uploadType === 'background') {
                slides[slideIndex].background_image = data.url;
            } else if (uploadType === 'single') {
                slides[slideIndex].image = data.url;
            } else if (uploadType === 'char-image') {
                slides[slideIndex].image = data.url;
            } else if (uploadType === 'layout-image') {
                slides[slideIndex].image = data.url;
            } else if (uploadType === 'avatar') {
                slides[slideIndex].avatar = data.url;
            } else if (uploadType === 'gallery') {
                if (!slides[slideIndex].images) slides[slideIndex].images = [];
                slides[slideIndex].images[position] = { url: data.url };
            } else if (uploadType === 'grid') {
                if (!slides[slideIndex].images) slides[slideIndex].images = [];
                slides[slideIndex].images[position] = { url: data.url };
            }
            
            // Показываем успех
            updateSaveIndicator('saved', '<i class="fas fa-check"></i> Изображение загружено');
            
            hasUnsavedChanges = true;
            triggerAutoSave();
            
            // Возвращаем результат
            return {
                success: true,
                url: data.url,
                slideIndex: slideIndex,
                uploadType: uploadType,
                position: position
            };
        } else {
            // Показываем ошибку
            updateSaveIndicator('error', '<i class="fas fa-exclamation-triangle"></i> Ошибка загрузки');
            alert('Ошибка загрузки: ' + (data.message || data.error || 'Неизвестная ошибка'));
            return { success: false, error: data.message || data.error };
        }
    } catch (error) {
        console.error('Upload error:', error);
        updateSaveIndicator('error', '<i class="fas fa-exclamation-triangle"></i> Ошибка');
        alert('Ошибка загрузки изображения: ' + error.message);
        return { success: false, error: error.message };
    }
}