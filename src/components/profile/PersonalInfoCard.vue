<template>
  <div>
    <div class="p-5 mb-6 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Персональная информация
          </h4>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Имя</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ currentUser?.name || '—' }}</p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Фамилия</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ currentUser?.last_name || '—' }}</p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email
              </p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ currentUser?.email || '—' }}
              </p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Телефон</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ displayPersonalPhone || '—' }}</p>
            </div>

            <div>
              <div class="mb-2 flex items-center justify-between">
                <p class="text-xs leading-normal text-gray-500 dark:text-gray-400">Дата рождения</p>
                <span
                  class="group/tooltip relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white cursor-help"
                  :title="birthdayTooltip"
                >
                  <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                  </svg>
                  <span class="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover/tooltip:opacity-100 dark:bg-gray-700 z-50">
                    {{ birthdayTooltip }}
                  </span>
                </span>
              </div>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ displayBirthday || '—' }}</p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">О себе</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ currentUser?.position || '—' }}</p>
            </div>
          </div>
        </div>

        <button class="edit-button" @click="isProfileInfoModal = true">
          <svg
            class="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          Редактировать
        </button>
      </div>
    </div>
    <Modal v-if="isProfileInfoModal" @close="isProfileInfoModal = false">
      <template #body>
        <div
          class="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11"
        >
          <!-- close btn -->
          <button
            @click="isProfileInfoModal = false"
            class="transition-color absolute right-5 top-5 z-999 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:bg-gray-700 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-gray-300"
          >
            <svg
              class="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M6.04289 16.5418C5.65237 16.9323 5.65237 17.5655 6.04289 17.956C6.43342 18.3465 7.06658 18.3465 7.45711 17.956L11.9987 13.4144L16.5408 17.9565C16.9313 18.347 17.5645 18.347 17.955 17.9565C18.3455 17.566 18.3455 16.9328 17.955 16.5423L13.4129 12.0002L17.955 7.45808C18.3455 7.06756 18.3455 6.43439 17.955 6.04387C17.5645 5.65335 16.9313 5.65335 16.5408 6.04387L11.9987 10.586L7.45711 6.04439C7.06658 5.65386 6.43342 5.65386 6.04289 6.04439C5.65237 6.43491 5.65237 7.06808 6.04289 7.4586L10.5845 12.0002L6.04289 16.5418Z"
                fill=""
              />
            </svg>
          </button>
          <div class="px-2 pr-14">
            <h4 class="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Редактирование персональной информации
            </h4>
            <p class="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Обновите данные для актуальности профиля.
            </p>
          </div>
          <form @submit.prevent="saveProfile" class="flex flex-col">
            <div v-if="error" class="mb-4 mx-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {{ error }}
            </div>
            <div class="custom-scrollbar h-[458px] overflow-y-auto p-2">
              <div class="mt-7">
                <h5 class="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>

                <div class="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div class="col-span-2 lg:col-span-1">
                    <label
                      class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                    >
                      Имя
                    </label>
                    <input
                      v-model="formData.name"
                      type="text"
                      placeholder="Введите имя"
                      class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>

                  <div class="col-span-2 lg:col-span-1">
                    <label
                      class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                    >
                      Фамилия
                    </label>
                    <input
                      v-model="formData.last_name"
                      type="text"
                      placeholder="Введите фамилию"
                      class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>

                  <div class="col-span-2 lg:col-span-1">
                    <label
                      class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                    >
                      Email
                    </label>
                    <input
                      :value="currentUser?.email"
                      type="email"
                      readonly
                      class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    />
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Email нельзя изменить</p>
                  </div>

                  <div class="col-span-2 lg:col-span-1">
                    <label
                      class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                    >
                      Телефон
                    </label>
                    <input
                      v-model="formData.personal_phone"
                      type="tel"
                      placeholder="+7 (000) 000-00-00"
                      @input="handlePhoneInput"
                      maxlength="18"
                      class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>

                  <div class="col-span-2 lg:col-span-1">
                    <div class="mb-1.5 flex items-center justify-between">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-400">
                        Дата рождения
                      </label>
                      <span
                        class="group/tooltip relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white cursor-help"
                        :title="birthdayTooltip"
                      >
                        <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                        </svg>
                        <span class="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover/tooltip:opacity-100 dark:bg-gray-700">
                          {{ birthdayTooltip }}
                        </span>
                      </span>
                    </div>
                    <input
                      v-model="formData.birthday"
                      type="date"
                      class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>

                  <div class="col-span-2">
                    <label
                      class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                    >
                      О себе
                    </label>
                    <textarea
                      v-model="formData.position"
                      rows="4"
                      placeholder="Введите описание"
                      class="dark:bg-dark-900 h-[100px] w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 resize-y"
                    />
                  </div>

                  <!-- Мессенджеры — перед блоком смены пароля -->
                  <div class="col-span-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h5 class="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                      Мессенджеры
                    </h5>
                    <div class="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                      <div v-for="item in messengerItems" :key="item.key">
                        <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ item.title }}</label>
                        <div class="flex items-center gap-[15px]">
                          <input
                            v-model="formData.messengers[item.key]"
                            type="url"
                            :placeholder="item.placeholder"
                            class="dark:bg-dark-900 h-11 flex-1 min-w-0 appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                          />
                          <span
                            class="flex shrink-0 items-center justify-center w-12 h-12 rounded-xl border-2 border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
                            :title="item.title"
                          >
                            <img :src="item.icon" :alt="item.title" class="w-6 h-6 object-contain pointer-events-none" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Смена пароля — только для пользователей, зарегистрированных по email -->
                  <template v-if="canChangePassword">
                    <div class="col-span-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h5 class="mb-4 text-base font-medium text-gray-800 dark:text-white/90">
                        Смена пароля
                      </h5>
                      <button
                        v-if="!wantToChangePassword"
                        type="button"
                        @click="wantToChangePassword = true"
                        class="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                      >
                        Хочу сменить пароль
                      </button>
                      <div v-else class="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                        <div class="col-span-2 lg:col-span-1">
                          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                            Текущий пароль
                          </label>
                          <div class="relative">
                            <input
                              v-model="formData.current_password"
                              :type="showCurrentPassword ? 'text' : 'password'"
                              placeholder="Введите текущий пароль"
                              autocomplete="current-password"
                              class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                            />
                            <span
                              @click="showCurrentPassword = !showCurrentPassword"
                              class="absolute z-30 flex items-center justify-center w-5 h-5 text-gray-500 -translate-y-1/2 cursor-pointer right-4 top-1/2 dark:text-gray-400"
                              aria-label="Показать/скрыть пароль"
                            >
                              <svg v-if="!showCurrentPassword" class="shrink-0 fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M10.0002 13.8619C7.23361 13.8619 4.86803 12.1372 3.92328 9.70241C4.86804 7.26761 7.23361 5.54297 10.0002 5.54297C12.7667 5.54297 15.1323 7.26762 16.0771 9.70243C15.1323 12.1372 12.7667 13.8619 10.0002 13.8619ZM10.0002 4.04297C6.48191 4.04297 3.49489 6.30917 2.4155 9.4593C2.3615 9.61687 2.3615 9.78794 2.41549 9.94552C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C13.5184 15.3619 16.5055 13.0957 17.5849 9.94555C17.6389 9.78797 17.6389 9.6169 17.5849 9.45932C16.5055 6.30919 13.5184 4.04297 10.0002 4.04297ZM9.99151 7.84413C8.96527 7.84413 8.13333 8.67606 8.13333 9.70231C8.13333 10.7286 8.96527 11.5605 9.99151 11.5605H10.0064C11.0326 11.5605 11.8646 10.7286 11.8646 9.70231C11.8646 8.67606 11.0326 7.84413 10.0064 7.84413H9.99151Z" fill="currentColor" />
                              </svg>
                              <svg v-else class="shrink-0 fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.63803 3.57709C4.34513 3.2842 3.87026 3.2842 3.57737 3.57709C3.28447 3.86999 3.28447 4.34486 3.57737 4.63775L4.85323 5.91362C3.74609 6.84199 2.89363 8.06395 2.4155 9.45936C2.3615 9.61694 2.3615 9.78801 2.41549 9.94558C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C11.255 15.3619 12.4422 15.0737 13.4994 14.5598L15.3625 16.4229C15.6554 16.7158 16.1302 16.7158 16.4231 16.4229C16.716 16.13 16.716 15.6551 16.4231 15.3622L4.63803 3.57709ZM12.3608 13.4212L10.4475 11.5079C10.3061 11.5423 10.1584 11.5606 10.0064 11.5606H9.99151C8.96527 11.5606 8.13333 10.7286 8.13333 9.70237C8.13333 9.5461 8.15262 9.39434 8.18895 9.24933L5.91885 6.97923C5.03505 7.69015 4.34057 8.62704 3.92328 9.70247C4.86803 12.1373 7.23361 13.8619 10.0002 13.8619C10.8326 13.8619 11.6287 13.7058 12.3608 13.4212ZM16.0771 9.70249C15.7843 10.4569 15.3552 11.1432 14.8199 11.7311L15.8813 12.7925C16.6329 11.9813 17.2187 11.0143 17.5849 9.94561C17.6389 9.78803 17.6389 9.61696 17.5849 9.45938C16.5055 6.30925 13.5184 4.04303 10.0002 4.04303C9.13525 4.04303 8.30244 4.17999 7.52218 4.43338L8.75139 5.66259C9.1556 5.58413 9.57311 5.54303 10.0002 5.54303C12.7667 5.54303 15.1323 7.26768 16.0771 9.70249Z" fill="currentColor" />
                              </svg>
                            </span>
                          </div>
                        </div>
                        <div class="col-span-2 lg:col-span-1">
                          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                            Новый пароль
                          </label>
                          <div class="relative">
                            <input
                              v-model="formData.new_password"
                              :type="showNewPassword ? 'text' : 'password'"
                              placeholder="Введите новый пароль"
                              autocomplete="new-password"
                              class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                            />
                            <span
                              @click="showNewPassword = !showNewPassword"
                              class="absolute z-30 flex items-center justify-center w-5 h-5 text-gray-500 -translate-y-1/2 cursor-pointer right-4 top-1/2 dark:text-gray-400"
                              aria-label="Показать/скрыть пароль"
                            >
                              <svg v-if="!showNewPassword" class="shrink-0 fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M10.0002 13.8619C7.23361 13.8619 4.86803 12.1372 3.92328 9.70241C4.86804 7.26761 7.23361 5.54297 10.0002 5.54297C12.7667 5.54297 15.1323 7.26762 16.0771 9.70243C15.1323 12.1372 12.7667 13.8619 10.0002 13.8619ZM10.0002 4.04297C6.48191 4.04297 3.49489 6.30917 2.4155 9.4593C2.3615 9.61687 2.3615 9.78794 2.41549 9.94552C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C13.5184 15.3619 16.5055 13.0957 17.5849 9.94555C17.6389 9.78797 17.6389 9.6169 17.5849 9.45932C16.5055 6.30919 13.5184 4.04297 10.0002 4.04297ZM9.99151 7.84413C8.96527 7.84413 8.13333 8.67606 8.13333 9.70231C8.13333 10.7286 8.96527 11.5605 9.99151 11.5605H10.0064C11.0326 11.5605 11.8646 10.7286 11.8646 9.70231C11.8646 8.67606 11.0326 7.84413 10.0064 7.84413H9.99151Z" fill="currentColor" />
                              </svg>
                              <svg v-else class="shrink-0 fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.63803 3.57709C4.34513 3.2842 3.87026 3.2842 3.57737 3.57709C3.28447 3.86999 3.28447 4.34486 3.57737 4.63775L4.85323 5.91362C3.74609 6.84199 2.89363 8.06395 2.4155 9.45936C2.3615 9.61694 2.3615 9.78801 2.41549 9.94558C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C11.255 15.3619 12.4422 15.0737 13.4994 14.5598L15.3625 16.4229C15.6554 16.7158 16.1302 16.7158 16.4231 16.4229C16.716 16.13 16.716 15.6551 16.4231 15.3622L4.63803 3.57709ZM12.3608 13.4212L10.4475 11.5079C10.3061 11.5423 10.1584 11.5606 10.0064 11.5606H9.99151C8.96527 11.5606 8.13333 10.7286 8.13333 9.70237C8.13333 9.5461 8.15262 9.39434 8.18895 9.24933L5.91885 6.97923C5.03505 7.69015 4.34057 8.62704 3.92328 9.70247C4.86803 12.1373 7.23361 13.8619 10.0002 13.8619C10.8326 13.8619 11.6287 13.7058 12.3608 13.4212ZM16.0771 9.70249C15.7843 10.4569 15.3552 11.1432 14.8199 11.7311L15.8813 12.7925C16.6329 11.9813 17.2187 11.0143 17.5849 9.94561C17.6389 9.78803 17.6389 9.61696 17.5849 9.45938C16.5055 6.30925 13.5184 4.04303 10.0002 4.04303C9.13525 4.04303 8.30244 4.17999 7.52218 4.43338L8.75139 5.66259C9.1556 5.58413 9.57311 5.54303 10.0002 5.54303C12.7667 5.54303 15.1323 7.26768 16.0771 9.70249Z" fill="currentColor" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <button
                @click="isProfileInfoModal = false"
                type="button"
                class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Закрыть
              </button>
              <button
                type="submit"
                :disabled="loading"
                class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 sm:w-auto"
              >
                {{ loading ? 'Сохранение...' : 'Сохранить изменения' }}
              </button>
            </div>
          </form>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Modal from './Modal.vue'
import { useAuth } from '@/composables/useAuth'
import { api, ApiError } from '@/api/client'
import { usePhoneMask } from '@/composables/usePhoneMask'

const { currentUser, fetchUser } = useAuth()
const isProfileInfoModal = ref(false)
const loading = ref(false)
const error = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
/** Пользователь нажал «Хочу сменить пароль» — показываем поля пароля (чтобы браузер не предлагал сохранить пароль при простом сохранении профиля) */
const wantToChangePassword = ref(false)

const messengerItems = [
  { key: 'whatsapp', title: 'WhatsApp', icon: '/images/icons/whatsapp-color.svg', placeholder: 'https://wa.me/...' },
  { key: 'telegram', title: 'Telegram', icon: '/images/icons/telegram-color.svg', placeholder: 'https://t.me/...' },
  { key: 'viber', title: 'Viber', icon: '/images/icons/viber-color.svg', placeholder: 'viber://chat?number=...' },
  { key: 'instagram', title: 'Instagram', icon: '/images/icons/instagram-color.svg', placeholder: 'https://instagram.com/...' },
  { key: 'twitter', title: 'Twitter', icon: '/images/icons/twitter-color.svg', placeholder: 'https://twitter.com/...' },
  { key: 'x', title: 'X', icon: '/images/icons/x-color.svg', placeholder: 'https://x.com/...' },
  { key: 'vk', title: 'Vk', icon: '/images/icons/vk-color.svg', placeholder: 'https://vk.com/...' },
  { key: 'max', title: 'Max', icon: '/images/icons/max-color.svg', placeholder: 'https://...' },
]

const formData = ref({
  name: '',
  last_name: '',
  personal_phone: '',
  position: '',
  birthday: '',
  current_password: '',
  new_password: '',
  messengers: {
    whatsapp: '',
    telegram: '',
    viber: '',
    instagram: '',
    twitter: '',
    x: '',
    vk: '',
    max: '',
  },
})

const birthdayTooltip = 'Укажите дату рождения для получения скидок и персональных предложений в день вашего рождения'

// Показывать блок смены пароля только если пользователь зарегистрирован по email (не через соц. сети)
const socialProviders = ['google', 'yandex', 'vk', 'facebook', 'apple']
const canChangePassword = computed(() => {
  const provider = currentUser.value?.auth_provider
  if (!provider) return true // нет провайдера — считаем email-регистрацию
  return !socialProviders.includes(provider.toLowerCase())
})

// Заполнить форму данными пользователя при открытии модального окна
watch(isProfileInfoModal, (isOpen) => {
  if (!isOpen) wantToChangePassword.value = false
  if (isOpen && currentUser.value) {
    const phone = currentUser.value.personal_phone || ''
    const u = currentUser.value
    const bd = u?.birthday
    const birthdayValue = bd ? (String(bd).match(/^\d{4}-\d{2}-\d{2}$/) ? bd : formatBirthdayToInput(String(bd))) : ''
    formData.value = {
      name: u?.name || '',
      last_name: u?.last_name || '',
      personal_phone: phone ? formatPhone(phone) : '',
      position: u?.position || '',
      birthday: birthdayValue,
      current_password: '',
      new_password: '',
      messengers: {
        whatsapp: currentUser.value.messengers?.whatsapp || '',
        telegram: currentUser.value.messengers?.telegram || '',
        viber: currentUser.value.messengers?.viber || '',
        instagram: currentUser.value.messengers?.instagram || '',
        twitter: currentUser.value.messengers?.twitter || '',
        x: currentUser.value.messengers?.x || '',
        vk: currentUser.value.messengers?.vk || '',
        max: currentUser.value.messengers?.max || '',
      },
    }
    error.value = ''
  }
})

const { formatPhone } = usePhoneMask()

const displayPersonalPhone = computed(() => {
  const raw = currentUser.value?.personal_phone
  if (!raw || !String(raw).trim()) return ''
  return formatPhone(String(raw))
})

/** Преобразует дату в YYYY-MM-DD для input type="date" */
function formatBirthdayToInput(value: string): string {
  if (!value || !String(value).trim()) return ''
  const s = String(value).trim()
  const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (isoMatch) return s
  const dmyMatch = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return ''
}

/** Форматирует дату рождения в ДД.ММ.ГГГГ (принимает YYYY-MM-DD, DD.MM.YYYY, D.M.YYYY и др.) */
function formatBirthdayDisplay(value: string | null | undefined): string {
  if (!value || !String(value).trim()) return ''
  const s = String(value).trim()
  // YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    return `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${y}`
  }
  // DD.MM.YYYY или D.M.YYYY
  const dmyMatch = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch
    return `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${y}`
  }
  // DD.MM (без года) — оставляем как есть
  if (/^\d{1,2}\.\d{1,2}$/.test(s)) return s
  return s
}

const displayBirthday = computed(() => formatBirthdayDisplay(currentUser.value?.birthday))

const handlePhoneInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const formatted = formatPhone(input.value)
  formData.value.personal_phone = formatted
  input.value = formatted
}

const saveProfile = async (e: Event) => {
  e.preventDefault()
  if (loading.value) return // Предотвратить повторные вызовы
  
  error.value = ''
  loading.value = true
  try {
    const cleanPhone = formData.value.personal_phone.replace(/\D/g, '')
    const messengers: { [key: string]: string } = {}
    Object.entries(formData.value.messengers).forEach(([key, value]) => {
      if (value && value.trim()) messengers[key] = value.trim()
    })
    await api.put('/api/auth/profile', {
      name: formData.value.name.trim() || undefined,
      last_name: formData.value.last_name.trim() || undefined,
      personal_phone: cleanPhone || undefined,
      position: formData.value.position.trim() || undefined,
      birthday: formData.value.birthday?.trim() || undefined,
      messengers: Object.keys(messengers).length > 0 ? messengers : undefined,
    })
    // Смена пароля (если заполнены оба поля)
    if (formData.value.current_password && formData.value.new_password) {
      await api.put('/api/auth/password', {
        current_password: formData.value.current_password,
        new_password: formData.value.new_password,
      })
    }
    await fetchUser()
    isProfileInfoModal.value = false
  } catch (err) {
    console.error('Ошибка сохранения профиля:', err)
    if (err instanceof ApiError) {
      error.value = err.message || 'Ошибка сохранения'
    } else {
      error.value = 'Ошибка соединения с сервером'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUser()
})
</script>
