<template>
  <admin-layout>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <!-- Левая колонка, ряд 1: Клиенты / Заказы -->
      <div class="col-span-12 xl:col-span-7">
        <ecommerce-metrics />
      </div>
      <!-- Правая колонка: Месячная цель на высоту двух рядов (Клиенты+Заказы и Продажи за месяц) -->
      <div class="col-span-12 xl:col-span-5 xl:row-span-2">
        <monthly-target />
      </div>
      <!-- Левая колонка, ряд 2: Продажи за месяц -->
      <div class="col-span-12 xl:col-span-7">
        <monthly-sale />
      </div>

      <div class="col-span-12">
        <statistics-chart />
      </div>

      <div class="col-span-12 xl:col-span-5">
        <customer-demographic />
      </div>

      <div class="col-span-12 xl:col-span-7">
        <recent-orders />
      </div>
    </div>
  </admin-layout>
</template>

<script>
import AdminLayout from '@/components/layout/AdminLayout.vue'
import EcommerceMetrics from '@/components/ecommerce/EcommerceMetrics.vue'
import MonthlyTarget from '@/components/ecommerce/MonthlyTarget.vue'
import MonthlySale from '@/components/ecommerce/MonthlySale.vue'
import CustomerDemographic from '@/components/ecommerce/CustomerDemographic.vue'
import StatisticsChart from '@/components/ecommerce/StatisticsChart.vue'
import RecentOrders from '@/components/ecommerce/RecentOrders.vue'

export default {
  name: 'Ecommerce',
  components: {
    AdminLayout,
    EcommerceMetrics,
    MonthlyTarget,
    MonthlySale,
    CustomerDemographic,
    StatisticsChart,
    RecentOrders,
  },
}
</script>
