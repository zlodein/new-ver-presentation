import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/api/client'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'Landing',
      component: () => import('../views/Home/Landing.vue'),
      meta: {
        title: 'E-Presentation',
      },
    },
    {
      path: '/dashboard',
      name: 'Ecommerce',
      component: () => import('../views/Ecommerce.vue'),
      meta: {
        title: 'Панель управления',
      },
    },
    {
      path: '/dashboard/presentations',
      name: 'Presentations',
      component: () => import('../views/Presentations/PresentationsList.vue'),
      meta: {
        title: 'Презентации',
      },
    },
    {
      path: '/dashboard/presentations/new',
      name: 'PresentationNew',
      component: () => import('../views/Presentations/PresentationEditor.vue'),
      meta: {
        title: 'Новая презентация',
      },
    },
    {
      path: '/dashboard/presentations/:id/edit',
      name: 'PresentationEdit',
      component: () => import('../views/Presentations/PresentationEditor.vue'),
      meta: {
        title: 'Редактор презентации',
      },
    },
    {
      path: '/dashboard/presentations/:id/view',
      name: 'PresentationViewOwner',
      component: () => import('../views/Presentations/PresentationView.vue'),
      meta: {
        title: 'Просмотр презентации',
      },
    },
    {
      path: '/view/:hash',
      name: 'PresentationViewPublic',
      component: () => import('../views/Presentations/PresentationView.vue'),
      meta: {
        title: 'Презентация',
      },
    },
    {
      path: '/dashboard/calendar',
      name: 'Calendar',
      component: () => import('../views/Others/Calendar.vue'),
      meta: {
        title: 'Календарь',
      },
    },
    {
      path: '/dashboard/profile',
      name: 'Profile',
      component: () => import('../views/Others/UserProfile.vue'),
      meta: {
        title: 'Профиль',
      },
    },
    {
      path: '/dashboard/form-elements',
      name: 'Form Elements',
      component: () => import('../views/Forms/FormElements.vue'),
      meta: {
        title: 'Элементы формы',
      },
    },
    {
      path: '/dashboard/basic-tables',
      name: 'Basic Tables',
      component: () => import('../views/Tables/BasicTables.vue'),
      meta: {
        title: 'Базовые таблицы',
      },
    },
    {
      path: '/dashboard/line-chart',
      name: 'Line Chart',
      component: () => import('../views/Chart/LineChart/LineChart.vue'),
    },
    {
      path: '/dashboard/bar-chart',
      name: 'Bar Chart',
      component: () => import('../views/Chart/BarChart/BarChart.vue'),
    },
    {
      path: '/dashboard/alerts',
      name: 'Alerts',
      component: () => import('../views/UiElements/Alerts.vue'),
      meta: {
        title: 'Оповещения',
      },
    },
    {
      path: '/dashboard/avatars',
      name: 'Avatars',
      component: () => import('../views/UiElements/Avatars.vue'),
      meta: {
        title: 'Аватары',
      },
    },
    {
      path: '/dashboard/badge',
      name: 'Badge',
      component: () => import('../views/UiElements/Badges.vue'),
      meta: {
        title: 'Значки',
      },
    },
    {
      path: '/dashboard/buttons',
      name: 'Buttons',
      component: () => import('../views/UiElements/Buttons.vue'),
      meta: {
        title: 'Кнопки',
      },
    },
    {
      path: '/dashboard/images',
      name: 'Images',
      component: () => import('../views/UiElements/Images.vue'),
      meta: {
        title: 'Изображения',
      },
    },
    {
      path: '/dashboard/videos',
      name: 'Videos',
      component: () => import('../views/UiElements/Videos.vue'),
      meta: {
        title: 'Видео',
      },
    },
    {
      path: '/dashboard/blank',
      name: 'Blank',
      component: () => import('../views/Pages/BlankPage.vue'),
      meta: {
        title: 'Пустая страница',
      },
    },
    {
      path: '/dashboard/notifications',
      name: 'Notifications',
      component: () => import('../views/Pages/NotificationsPage.vue'),
      meta: {
        title: 'Уведомления',
      },
    },
    {
      path: '/dashboard/error-404',
      name: '404 Error',
      component: () => import('../views/Errors/FourZeroFour.vue'),
      meta: {
        title: 'Ошибка 404',
      },
    },
    {
      path: '/administration',
      name: 'Administration',
      component: () => import('../views/Administration/AdministrationIndex.vue'),
      meta: {
        title: 'Администрирование',
      },
    },
    {
      path: '/signin',
      name: 'Signin',
      component: () => import('../views/Auth/Signin.vue'),
      meta: {
        title: 'Вход',
      },
    },
    {
      path: '/signup',
      name: 'Signup',
      component: () => import('../views/Auth/Signup.vue'),
      meta: {
        title: 'Регистрация',
      },
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('../views/Auth/ResetPassword.vue'),
      meta: {
        title: 'Восстановление пароля',
      },
    },
    // Все неизвестные пути — редирект на страницу 404
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      redirect: () => ({ path: '/dashboard/error-404' }),
      meta: {
        title: 'Ошибка 404',
      },
    },
  ],
})

// Обработка 404 при загрузке чанков (после деплоя старые URL чанков перестают работать)
router.onError((err) => {
  const msg = err?.message || ''
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk')
  ) {
    window.location.reload()
  } else {
    throw err
  }
})

export default router

router.beforeEach((to, from, next) => {
  const requiresAuth = to.path.startsWith('/dashboard') || to.path === '/administration'
  const token = getToken()
  if (requiresAuth && !token) {
    next({ path: '/signin', query: { redirect: to.fullPath } })
    return
  }
  const title = to.meta?.title
  document.title = title ? `${String(title)} | E-Presentation` : 'E-Presentation'
  next()
})
