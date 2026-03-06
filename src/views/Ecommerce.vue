<template>
  <admin-layout>
    <div class="grid grid-cols-12 gap-4 md:gap-6" style="grid-template-rows: minmax(190px, auto) minmax(190px, auto) auto;">
      <!-- Левая колонка, ряд 1: Предстоящие события / Задачи (высота как у «Ваш тариф») -->
      <div class="col-span-12 xl:col-span-7 min-h-0 h-full">
        <div class="grid h-full grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
          <upcoming-schedule />
          <dashboard-tasks-list />
        </div>
      </div>
      <!-- Правая колонка: Месячная цель на высоту двух рядов -->
      <div class="col-span-12 xl:col-span-5 xl:row-span-2">
        <monthly-target />
      </div>
      <!-- Второй ряд: заглушка (высота как у «Ваш тариф») -->
      <div class="col-span-12 xl:col-span-7 w-full min-h-0 h-full">
        <dashboard-placeholder />
      </div>

      <div class="col-span-12">
        <statistics-chart />
      </div>

      <div class="col-span-12 xl:col-span-5">
        <active-sessions />
      </div>

      <div class="col-span-12 xl:col-span-7">
        <my-presentations />
      </div>
    </div>
  </admin-layout>
</template>

<script>
import AdminLayout from '@/components/layout/AdminLayout.vue'
import UpcomingSchedule from '@/components/ecommerce/UpcomingSchedule.vue'
import DashboardTasksList from '@/components/ecommerce/DashboardTasksList.vue'
import DashboardPlaceholder from '@/components/ecommerce/DashboardPlaceholder.vue'
import MonthlyTarget from '@/components/ecommerce/MonthlyTarget.vue'
import ActiveSessions from '@/components/ecommerce/ActiveSessions.vue'
import StatisticsChart from '@/components/ecommerce/StatisticsChart.vue'
import MyPresentations from '@/components/ecommerce/MyPresentations.vue'

export default {
  name: 'Ecommerce',
  components: {
    AdminLayout,
    UpcomingSchedule,
    DashboardTasksList,
    DashboardPlaceholder,
    MonthlyTarget,
    ActiveSessions,
    StatisticsChart,
    MyPresentations,
  },
}
</script>
