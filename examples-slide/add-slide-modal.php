<div class="modal modal-blur fade" id="addSlideModal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler me-2">
                        <path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" />
                        <path d="M12 12l8 -4.5" />
                        <path d="M12 12l0 9" />
                        <path d="M12 12l-8 -4.5" />
                        <path d="M16 5.25l-8 4.5" />
                    </svg>
                    Выберите тип слайда
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="row g-3 slide-type-grid">
                    <div class="col-md-6 col-lg-4">
                        <div class="card card-sm slide-type-card" onclick="addSlideOfType('cover')" style="cursor: pointer;">
                            <div class="card-body text-center">
                                <div class="mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-lg text-primary">
                                        <path d="M3 9l9 -7l9 7v11a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
                                        <path d="M9 22v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
                                    </svg>
                                </div>
                                <h4 class="card-title">Обложка</h4>
                                <p class="text-secondary text-muted mb-0">Первый слайд с названием и ценой</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-4">
                        <div class="card card-sm slide-type-card" onclick="addSlideOfType('description')" style="cursor: pointer;">
                            <div class="card-body text-center">
                                <div class="mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-lg text-primary">
                                        <path d="M4 6l16 0" />
                                        <path d="M4 12l16 0" />
                                        <path d="M4 18l12 0" />
                                    </svg>
                                </div>
                                <h4 class="card-title">Описание</h4>
                                <p class="text-secondary text-muted mb-0">Текст с двумя изображениями</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-4">
                        <div class="card card-sm slide-type-card" onclick="addSlideOfType('infrastructure')" style="cursor: pointer;">
                            <div class="card-body text-center">
                                <div class="mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-lg text-primary">
                                        <path d="M3 21l18 0" />
                                        <path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16" />
                                        <path d="M9 21v-8a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 8v8" />
                                    </svg>
                                </div>
                                <h4 class="card-title">Инфраструктура</h4>
                                <p class="text-secondary text-muted mb-0">Текст + 2 изображения</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-4">
                        <div class="card card-sm slide-type-card" onclick="addSlideOfType('features')" style="cursor: pointer;">
                            <div class="card-body text-center">
                                <div class="mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-lg text-primary">
                                        <path d="M12 2l3.09 6.26l6.91 1.01l-5 4.87l1.18 6.88l-6.18 -3.25l-6.18 3.25l1.18 -6.88l-5 -4.87l6.91 -1.01z" />
                                    </svg>
                                </div>
                                <h4 class="card-title">Особенности</h4>
                                <p class="text-secondary text-muted mb-0">Список с двумя изображениями</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-4">
                        <div class="card card-sm slide-type-card" onclick="addSlideOfType('location')" style="cursor: pointer;">
                            <div class="card-body text-center">
                                <div class="mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-lg text-primary">
                                        <path d="M21 10c0 7 -9 13 -9 13s-9 -6 -9 -13a9 9 0 0 1 18 0z" />
                                        <path d="M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                                    </svg>
                                </div>
                                <h4 class="card-title">Местоположение</h4>
                                <p class="text-secondary text-muted mb-0">Карта с информацией</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-4">
                        <div class="card card-sm slide-type-card" onclick="addSlideOfType('image')" style="cursor: pointer;">
                            <div class="card-body text-center">
                                <div class="mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-lg text-primary">
                                        <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2z" />
                                        <path d="M9 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                                        <path d="M19 15l-5 -5l-5 5" />
                                    </svg>
                                </div>
                                <h4 class="card-title">Изображение</h4>
                                <p class="text-secondary text-muted mb-0">Одно большое изображение</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-4">
                        <div class="card card-sm slide-type-card" onclick="addSlideOfType('gallery')" style="cursor: pointer;">
                            <div class="card-body text-center">
                                <div class="mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-lg text-primary">
                                        <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2z" />
                                        <path d="M9 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                                        <path d="M19 15l-5 -5l-5 5" />
                                    </svg>
                                </div>
                                <h4 class="card-title">Галерея</h4>
                                <p class="text-secondary text-muted mb-0">3 изображения</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-4">
                        <div class="card card-sm slide-type-card" onclick="addSlideOfType('characteristics')" style="cursor: pointer;">
                            <div class="card-body text-center">
                                <div class="mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-lg text-primary">
                                        <path d="M3 12h18" />
                                        <path d="M3 6h18" />
                                        <path d="M3 18h18" />
                                    </svg>
                                </div>
                                <h4 class="card-title">Характеристики</h4>
                                <p class="text-secondary text-muted mb-0">Таблица с параметрами</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-4">
                        <div class="card card-sm slide-type-card" onclick="addSlideOfType('layout')" style="cursor: pointer;">
                            <div class="card-body text-center">
                                <div class="mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-lg text-primary">
                                        <path d="M3 3h8v8h-8z" />
                                        <path d="M13 3h8v8h-8z" />
                                        <path d="M3 13h8v8h-8z" />
                                        <path d="M13 13h8v8h-8z" />
                                    </svg>
                                </div>
                                <h4 class="card-title">Планировка</h4>
                                <p class="text-secondary text-muted mb-0">Изображение с названием</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-4">
                        <div class="card card-sm slide-type-card" onclick="addSlideOfType('grid')" style="cursor: pointer;">
                            <div class="card-body text-center">
                                <div class="mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-lg text-primary">
                                        <path d="M3 3h7v7h-7z" />
                                        <path d="M14 3h7v7h-7z" />
                                        <path d="M14 14h7v7h-7z" />
                                        <path d="M3 14h7v7h-7z" />
                                    </svg>
                                </div>
                                <h4 class="card-title">Сетка</h4>
                                <p class="text-secondary text-muted mb-0">4 изображения</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-4">
                        <div class="card card-sm slide-type-card" onclick="addSlideOfType('contacts')" style="cursor: pointer;">
                            <div class="card-body text-center">
                                <div class="mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-lg text-primary">
                                        <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2 -2v-10" />
                                        <path d="M3 7l9 6l9 -6" />
                                    </svg>
                                </div>
                                <h4 class="card-title">Контакты</h4>
                                <p class="text-secondary text-muted mb-0">Контактная информация</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link link-secondary" data-bs-dismiss="modal">
                    Отмена
                </button>
            </div>
        </div>
    </div>
</div>
