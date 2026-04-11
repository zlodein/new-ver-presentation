<template>
  <PublicLayout>
    <div class="about-page space-y-0 pb-8">
      <!-- Hero -->
      <section
        class="relative overflow-hidden rounded-3xl border border-stone-200/80 bg-stone-950 text-stone-100 shadow-2xl shadow-stone-900/20 dark:border-white/10 dark:shadow-black/40"
      >
        <div
          class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(217,119,6,0.18),transparent)]"
        />
        <div
          class="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.25]"
          style="
            background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');
          "
        />
        <div class="relative px-6 py-16 sm:px-12 sm:py-20 lg:px-16 lg:py-24">
          <div class="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span
              class="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200/90"
            >
              E-Presentation
            </span>
            <a
              href="https://e-presentation.ru"
              class="text-sm text-stone-400 transition hover:text-amber-200/90"
              rel="noopener noreferrer"
            >
              e-presentation.ru
            </a>
          </div>
          <h1
            class="mb-6 max-w-4xl font-serif text-[2rem] font-normal leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]"
          >
            Единый стандарт<br class="hidden sm:block" />
            <span class="text-stone-300">маркетинговых материалов</span>
            <span class="bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent"> для недвижимости</span>
          </h1>
          <p
            class="mb-10 max-w-2xl text-lg leading-relaxed text-stone-400 sm:text-xl"
          >
            E-Presentation предназначен для агентств и самостоятельных брокеров, которым требуется предсказуемое
            качество вёрстки, сокращение времени на подготовку предложения и согласованный визуальный формат при работе с
            клиентом и внутри команды.
          </p>
          <div class="flex flex-wrap items-center gap-4">
            <router-link
              to="/tariffs"
              class="group inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-8 py-3.5 text-sm font-semibold text-stone-950 shadow-lg shadow-amber-900/30 transition hover:from-amber-500 hover:to-amber-400"
            >
              Тарифы
              <span class="ml-2 inline-block transition group-hover:translate-x-0.5">→</span>
            </router-link>
            <router-link
              to="/signup"
              class="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-medium text-stone-100 backdrop-blur-sm transition hover:border-white/30 hover:bg-white/10"
            >
              Создать аккаунт
            </router-link>
          </div>
        </div>
      </section>

      <!-- Кредо -->
      <section class="relative -mt-6 px-1 sm:px-0">
        <div
          class="mx-auto max-w-5xl rounded-2xl border border-stone-200/90 bg-white px-8 py-10 shadow-xl shadow-stone-200/50 dark:border-white/10 dark:bg-stone-900/80 dark:shadow-black/30 sm:px-12 sm:py-12"
        >
          <div class="mb-4 h-px w-16 bg-gradient-to-r from-amber-600 to-transparent dark:from-amber-500" />
          <p class="font-serif text-2xl font-normal leading-snug text-stone-800 dark:text-stone-100 sm:text-3xl">
            Качество подачи напрямую влияет на восприятие объекта и на готовность клиента переходить к следующему этапу
            сделки.
          </p>
          <p class="mt-6 max-w-3xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            Платформа ориентирована на отраслевые сценарии: от первичного контакта до сопровождения показа. Задача
            сервиса — снизить операционные затраты на подготовку материалов при сохранении делового тона и аккуратной
            подачи данных.
          </p>
        </div>
      </section>

      <!-- Миссия -->
      <section class="px-1 pt-10 sm:px-0 sm:pt-14">
        <div class="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div class="lg:col-span-4">
            <p class="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-700 dark:text-amber-500/80">
              Миссия
            </p>
            <h2 class="font-serif text-3xl font-normal text-stone-900 dark:text-white">
              Оптимизация процесса подготовки предложений
            </h2>
          </div>
          <div class="lg:col-span-8">
            <p class="text-base leading-relaxed text-stone-600 dark:text-stone-400">
              Сервис снижает трудозатраты на оформление объектов, обеспечивает повторяемость стандарта оформления для
              бренда агентства и сокращает риск расхождений между версиями материалов при передаче между сотрудниками и
              при взаимодействии с клиентом.
            </p>
          </div>
        </div>
      </section>

      <!-- Ценности -->
      <section class="px-1 pt-14 sm:px-0 sm:pt-20">
        <div class="mb-12 max-w-2xl">
          <p class="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-700 dark:text-amber-500/80">
            Ценности
          </p>
          <h2 class="font-serif text-3xl font-normal text-stone-900 dark:text-white sm:text-4xl">
            Принципы работы
          </h2>
          <p class="mt-3 text-sm text-stone-500 dark:text-stone-400">
            Базовые ориентиры, на которых строится продукт и взаимодействие с пользователями.
          </p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="(item, i) in values"
            :key="item.title"
            class="group relative overflow-hidden rounded-2xl border border-stone-200/90 bg-gradient-to-b from-white to-stone-50/80 p-8 transition duration-300 hover:border-amber-200/60 hover:shadow-lg hover:shadow-stone-200/40 dark:border-white/10 dark:from-stone-900/50 dark:to-stone-950 dark:hover:border-amber-500/20 dark:hover:shadow-black/20"
          >
            <div
              class="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-stone-200/80 bg-stone-100/80 text-amber-800 dark:border-white/10 dark:bg-white/5 dark:text-amber-400/90"
            >
              <component :is="item.icon" class="h-6 w-6" stroke-width="1.25" />
            </div>
            <h3 class="mb-3 font-serif text-xl text-stone-900 dark:text-white">
              {{ item.title }}
            </h3>
            <p class="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {{ item.text }}
            </p>
            <span
              class="absolute bottom-6 right-8 font-serif text-5xl font-light tabular-nums text-stone-200/90 transition group-hover:text-amber-200/30 dark:text-white/[0.06] dark:group-hover:text-amber-400/10"
              >{{ String(i + 1).padStart(2, '0') }}</span
            >
          </article>
        </div>
      </section>

      <!-- История -->
      <section class="px-1 pt-14 sm:px-0 sm:pt-20">
        <div
          class="overflow-hidden rounded-3xl border border-stone-200/90 bg-stone-50/50 dark:border-white/10 dark:bg-stone-900/40"
        >
          <div class="grid lg:grid-cols-2">
            <div class="relative min-h-[280px] bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950 p-10 lg:min-h-[320px]">
              <div
                class="absolute inset-0 opacity-40"
                style="
                  background-image: radial-gradient(circle at 30% 20%, rgba(217, 119, 6, 0.25), transparent 50%);
                "
              />
              <div class="relative flex h-full flex-col justify-end">
                <p class="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400/90">История</p>
                <p class="mt-2 font-serif text-2xl leading-snug text-white">
                  От внутренней задачи к отраслевому инструменту
                </p>
              </div>
            </div>
            <div class="flex flex-col justify-center p-10 lg:p-12">
              <p class="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                Проект развивался из практической потребности сократить цикл подготовки коммерческих материалов по объекту
                без привлечения отдельной команды вёрстки. Текущая версия сервиса объединяет шаблонную логику, редактор и
                сценарии под типовые классы недвижимости.
              </p>
              <details
                class="group mt-8 rounded-xl border border-stone-200/80 bg-white/60 px-5 py-4 dark:border-white/10 dark:bg-stone-950/40"
              >
                <summary
                  class="cursor-pointer list-none text-sm font-medium text-stone-800 dark:text-stone-200 [&::-webkit-details-marker]:hidden"
                >
                  <span class="flex items-center justify-between gap-2">
                    Развитие продукта
                    <span
                      class="text-stone-400 transition group-open:rotate-180 dark:text-stone-500"
                    >▼</span>
                  </span>
                </summary>
                <div class="mt-4 space-y-3 border-t border-stone-200/80 pt-4 text-sm leading-relaxed text-stone-600 dark:border-white/10 dark:text-stone-400">
                  <p>
                    При разработке учитывались типовые структуры презентаций по жилой, загородной и коммерческой
                    недвижимости. Приоритет отдавался наглядности данных, удобству навигации по слайдам и устойчивости
                    отображения на разных устройствах.
                  </p>
                  <p>
                    Дальнейшее развитие функционала опирается на обратную связь пользователей и регламент обновлений,
                    публикуемый в рамках сервиса.
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>

      <!-- Отзывы -->
      <section class="px-1 pt-14 sm:px-0 sm:pt-20">
        <div class="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-700 dark:text-amber-500/80">
              Отзывы
            </p>
            <h2 class="font-serif text-3xl font-normal text-stone-900 dark:text-white sm:text-4xl">
              Обратная связь пользователей
            </h2>
          </div>
          <div class="h-px flex-1 bg-gradient-to-r from-transparent via-stone-300 to-transparent dark:via-white/15 sm:ml-8 sm:max-w-md" />
        </div>
        <div class="grid gap-6 md:grid-cols-2">
          <figure
            v-for="(q, i) in quotes"
            :key="i"
            class="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-8 pt-12 dark:border-white/10 dark:bg-stone-900/60"
          >
            <span class="absolute left-6 top-4 font-serif text-6xl leading-none text-amber-600/15 dark:text-amber-400/10"
              >«</span
            >
            <blockquote class="relative mb-8 text-base leading-relaxed text-stone-700 dark:text-stone-300">
              {{ q.text }}
            </blockquote>
            <figcaption class="flex items-center gap-4 border-t border-stone-100 pt-6 dark:border-white/10">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-stone-200 to-stone-300 text-sm font-semibold text-stone-700 dark:from-stone-700 dark:to-stone-800 dark:text-stone-200"
              >
                {{ q.initials }}
              </div>
              <div>
                <span class="block font-medium text-stone-900 dark:text-white">{{ q.name }}</span>
                <span class="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-500">{{ q.role }}</span>
              </div>
            </figcaption>
          </figure>
        </div>
      </section>

      <!-- CTA -->
      <section class="px-1 pt-14 sm:px-0 sm:pt-20">
        <div
          class="relative overflow-hidden rounded-3xl border border-stone-200/80 bg-gradient-to-br from-stone-900 via-stone-950 to-black px-8 py-12 text-center sm:px-12 sm:py-16 dark:border-white/10"
        >
          <div
            class="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl"
          />
          <div
            class="pointer-events-none absolute -right-20 top-0 h-48 w-48 rounded-full bg-amber-600/5 blur-2xl"
          />
          <h2 class="relative font-serif text-2xl text-white sm:text-3xl">
            Оцените сервис в работе
          </h2>
          <p class="relative mx-auto mt-4 max-w-lg text-sm text-stone-400">
            Ознакомьтесь с тарифной сеткой и условиями доступа либо пройдите регистрацию для тестирования функционала в
            интерфейсе.
          </p>
          <div class="relative mt-8 flex flex-wrap justify-center gap-4">
            <router-link
              to="/tariffs"
              class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-10 py-3.5 text-sm font-semibold text-stone-950 shadow-lg shadow-amber-900/40 transition hover:from-amber-400 hover:to-amber-300"
            >
              Смотреть тарифы
            </router-link>
            <router-link
              to="/signin"
              class="inline-flex items-center justify-center rounded-full border border-white/20 px-10 py-3.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Войти
            </router-link>
          </div>
        </div>
      </section>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import PublicLayout from '@/components/layout/PublicLayout.vue'
import { Gem, Layers, ShieldCheck, Sparkles, Users } from 'lucide-vue-next'
import type { Component } from 'vue'

const values: { title: string; text: string; icon: Component }[] = [
  {
    title: 'Простота',
    text: 'Логика интерфейса выстроена вокруг пошагового заполнения карточки объекта без избыточных настроек на старте.',
    icon: Layers,
  },
  {
    title: 'Эффективность',
    text: 'Сокращение времени на подготовку материалов позволяет перераспределить ресурсы на коммуникацию с клиентом и сопровождение сделки.',
    icon: Sparkles,
  },
  {
    title: 'Качество',
    text: 'Шаблоны и типографика рассчитаны на корректное отображение на экранах различного разрешения, в том числе при удалённой демонстрации.',
    icon: Gem,
  },
  {
    title: 'Доверие',
    text: 'Условия использования и поддержка оформлены прозрачно; коммерческие параметры доводятся до сведения пользователя до оплаты.',
    icon: ShieldCheck,
  },
  {
    title: 'Развитие',
    text: 'Требования отрасли учитываются при планировании обновлений; приоритет отдаётся стабильности и предсказуемости поведения сервиса.',
    icon: Users,
  },
]

const quotes = [
  {
    text: 'Срок подготовки коммерческого предложения по объекту сократился; формат материалов приведён к единому корпоративному стандарту.',
    name: 'Елена П.',
    initials: 'ЕП',
    role: 'Эксперт по недвижимости',
  },
  {
    text: 'Удалось согласовать единый шаблон для отдела продаж и снизить количество правок при передаче файлов между сотрудниками.',
    name: 'Алексей З.',
    initials: 'АЗ',
    role: 'Руководитель агентства',
  },
]
</script>

<style scoped>
.about-page {
  font-feature-settings: 'kern' 1, 'liga' 1;
}
</style>
