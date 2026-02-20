<template>
  <admin-layout>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <!-- Первый ряд: Клиенты + Заказы (EcommerceMetrics) и Месячная цель -->
      <div class="col-span-12 xl:col-span-7">
        <ecommerce-metrics />
      </div>
      <div class="col-span-12 xl:col-span-5">
        <monthly-target />
      </div>

      <!-- Продажи за месяц — сразу под блоками Клиенты и Заказы, как в TailAdmin -->
      <div class="col-span-12">
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
