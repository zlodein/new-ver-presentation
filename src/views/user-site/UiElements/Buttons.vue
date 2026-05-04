<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Основная кнопка">
        <div class="flex items-center gap-5">
          <Button size="sm" variant="primary"> Текст кнопки </Button>
          <Button size="md" variant="primary"> Текст кнопки </Button>
        </div>
      </ComponentCard>
      <ComponentCard title="Основная кнопка с иконкой слева">
        <div class="flex items-center gap-5">
          <Button size="sm" variant="primary" :startIcon="BoxIcon"> Текст кнопки </Button>
          <Button size="md" variant="primary" :startIcon="BoxIcon"> Текст кнопки </Button>
        </div>
      </ComponentCard>
      <ComponentCard title="Основная кнопка с иконкой справа">
        <div class="flex items-center gap-5">
          <Button size="sm" variant="primary" :endIcon="BoxIcon"> Текст кнопки </Button>
          <Button size="md" variant="primary" :endIcon="BoxIcon"> Текст кнопки </Button>
        </div>
      </ComponentCard>
      <ComponentCard title="Контурная кнопка">
        <div class="flex items-center gap-5">
          <Button size="sm" variant="outline"> Текст кнопки </Button>
          <Button size="md" variant="outline"> Текст кнопки </Button>
        </div>
      </ComponentCard>
      <ComponentCard title="Контурная кнопка с иконкой слева">
        <div class="flex items-center gap-5">
          <Button size="sm" variant="outline" :startIcon="BoxIcon"> Текст кнопки </Button>
          <Button size="md" variant="outline" :startIcon="BoxIcon"> Текст кнопки </Button>
        </div>
      </ComponentCard>
      <ComponentCard title="Контурная кнопка с иконкой справа">
        <div class="flex items-center gap-5">
          <Button size="sm" variant="outline" :endIcon="BoxIcon"> Текст кнопки </Button>
          <Button size="md" variant="outline" :endIcon="BoxIcon"> Текст кнопки </Button>
        </div>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref } from 'vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import Button from '@/components/ui/Button.vue'
import { BoxIcon } from '@/icons'
const currentPageTitle = ref('Кнопки')
</script>

<style></style>
