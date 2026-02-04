<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div className="space-y-5 sm:space-y-6">
      <ComponentCard title="Успех">
        <Alert
          variant="success"
          title="Успешное сообщение"
          message="Будьте осторожны при выполнении этого действия."
          :showLink="true"
          linkHref="/"
          linkText="Подробнее"
        />
        <Alert
          variant="success"
          title="Успешное сообщение"
          message="Будьте осторожны при выполнении этого действия."
          :showLink="false"
        />
      </ComponentCard>
      <ComponentCard title="Предупреждение">
        <Alert
          variant="warning"
          title="Предупреждение"
          message="Будьте осторожны при выполнении этого действия."
          :showLink="true"
          linkHref="/"
          linkText="Подробнее"
        />
        <Alert
          variant="warning"
          title="Предупреждение"
          message="Будьте осторожны при выполнении этого действия."
          :showLink="false"
        />
      </ComponentCard>
      <ComponentCard title="Ошибка">
        <Alert
          variant="error"
          title="Сообщение об ошибке"
          message="Будьте осторожны при выполнении этого действия."
          :showLink="true"
          linkHref="/"
          linkText="Подробнее"
        />
        <Alert
          variant="error"
          title="Сообщение об ошибке"
          message="Будьте осторожны при выполнении этого действия."
          :showLink="false"
        />
      </ComponentCard>
      <ComponentCard title="Информация">
        <Alert
          variant="info"
          title="Информационное сообщение"
          message="Будьте осторожны при выполнении этого действия."
          :showLink="true"
          linkHref="/"
          linkText="Подробнее"
        />
        <Alert
          variant="info"
          title="Информационное сообщение"
          message="Будьте осторожны при выполнении этого действия."
          :showLink="false"
        />
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref } from 'vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import Alert from '@/components/ui/Alert.vue'
const currentPageTitle = ref('Оповещения')
</script>

<style></style>
