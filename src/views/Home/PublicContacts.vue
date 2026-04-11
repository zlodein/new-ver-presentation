<template>
  <PublicLayout>
    <div class="space-y-8">
      <div
        class="rounded-2xl border border-gray-200 bg-white px-5 py-10 dark:border-gray-800 dark:bg-white/[0.03] sm:px-8 sm:py-12"
      >
        <h1 class="mb-2 text-left text-2xl font-semibold text-gray-800 dark:text-white sm:text-3xl">
          Контакты
        </h1>
        <p class="mb-10 max-w-2xl text-left text-sm text-gray-500 dark:text-gray-400">
          Реквизиты и контактные данные для деловой переписки. Актуальные значения будут опубликованы после
          финализации регистрационных данных сервиса.
        </p>
        <dl class="grid gap-6 sm:grid-cols-2 lg:gap-8">
          <div class="rounded-xl border border-gray-100 bg-gray-50/80 px-5 py-4 dark:border-white/10 dark:bg-white/[0.02]">
            <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Юридический адрес
            </dt>
            <dd class="mt-2 text-sm text-gray-800 dark:text-gray-200">
              [будет указан]
            </dd>
          </div>
          <div class="rounded-xl border border-gray-100 bg-gray-50/80 px-5 py-4 dark:border-white/10 dark:bg-white/[0.02]">
            <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Электронная почта
            </dt>
            <dd class="mt-2 text-sm">
              <a
                class="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                href="mailto:info@e-presentation.ru"
              >info@e-presentation.ru</a>
            </dd>
          </div>
          <div class="rounded-xl border border-gray-100 bg-gray-50/80 px-5 py-4 dark:border-white/10 dark:bg-white/[0.02]">
            <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Телефон
            </dt>
            <dd class="mt-2 text-sm text-gray-800 dark:text-gray-200">
              [будет указан]
            </dd>
          </div>
          <div class="rounded-xl border border-gray-100 bg-gray-50/80 px-5 py-4 dark:border-white/10 dark:bg-white/[0.02]">
            <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Режим работы поддержки
            </dt>
            <dd class="mt-2 text-sm text-gray-800 dark:text-gray-200">
              [будет указан]
            </dd>
          </div>
          <div class="sm:col-span-2 rounded-xl border border-gray-100 bg-gray-50/80 px-5 py-4 dark:border-white/10 dark:bg-white/[0.02]">
            <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Реквизиты для договора и оплаты
            </dt>
            <dd class="mt-2 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
              Полный комплект реквизитов (ИНН, КПП, ОГРН, расчётный счёт) предоставляется по запросу на
              <a class="text-brand-600 hover:underline dark:text-brand-400" href="mailto:info@e-presentation.ru">info@e-presentation.ru</a>
              либо в личном кабинете после запуска соответствующего раздела.
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import PublicLayout from '@/components/layout/PublicLayout.vue'
</script>
