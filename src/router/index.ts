import { createRouter, createWebHistory } from 'vue-router'
import { getToken, api, getApiBase, hasApi } from '@/api/client'

const AUTH_PATHS = new Set(['/signin', '/signin/2fa', '/signup', '/reset-password', '/verify'])

function sanitizeRedirectTarget(rawRedirect: unknown, fallback = '/dashboard'): string {
  if (typeof rawRedirect !== 'string' || !rawRedirect) return fallback
  let candidate = rawRedirect
  for (let i = 0; i < 2; i += 1) {
    try {
      const decoded = decodeURIComponent(candidate)
      if (decoded === candidate) break
      candidate = decoded
    } catch {
      break
    }
  }
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return fallback
  const pathOnly = candidate.split('?')[0] || candidate
  if (AUTH_PATHS.has(pathOnly)) return fallback
  return candidate
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    /* Якоря #block-N обрабатывает PresentationView после загрузки слайдов */
    if (to.hash && to.hash.startsWith('#block-')) return false
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'PublicIndex',
      component: () => import('../views/public-site/Home/PublicIndex.vue'),
      meta: {
        title: 'E-Presentation',
      },
    },
    {
      path: '/tariffs',
      name: 'PublicTariffs',
      component: () => import('../views/public-site/Tariffs/PublicTariffs.vue'),
      meta: {
        title: 'Тарифы',
      },
    },
    {
      path: '/privacy',
      name: 'PrivacyPolicy',
      component: () => import('../views/public-site/Legal/PrivacyPolicy.vue'),
      meta: {
        title: 'Политика конфиденциальности',
      },
    },
    {
      path: '/terms',
      name: 'TermsConditions',
      component: () => import('../views/public-site/Legal/TermsConditions.vue'),
      meta: {
        title: 'Правила и условия',
      },
    },
    {
      path: '/dashboard',
      name: 'Ecommerce',
      component: () => import('../views/user-site/Ecommerce.vue'),
      meta: {
        title: 'Панель управления',
      },
    },
    {
      path: '/dashboard/presentations',
      name: 'Presentations',
      component: () => import('../views/user-site/Presentations/PresentationsList.vue'),
      meta: {
        title: 'Презентации',
      },
    },
    {
      path: '/dashboard/presentations/new',
      name: 'PresentationNew',
      component: () => import('../views/editor/PresentationEditor.vue'),
      meta: {
        title: 'Новая презентация',
      },
    },
    {
      path: '/dashboard/presentations/:id/edit',
      name: 'PresentationEdit',
      component: () => import('../views/editor/PresentationEditor.vue'),
      meta: {
        title: 'Редактор презентации',
      },
    },
    {
      path: '/dashboard/presentations/:id/view',
      name: 'PresentationViewOwner',
      component: () => import('../views/viewer/PresentationView.vue'),
      meta: {
        title: 'Просмотр презентации',
      },
    },
    {
      path: '/view/:shortId/:slug',
      name: 'PresentationViewPublicSlug',
      component: () => import('../views/viewer/PresentationView.vue'),
      meta: {
        title: 'Презентация',
      },
    },
    {
      path: '/view/:hash',
      name: 'PresentationViewPublic',
      component: () => import('../views/viewer/PresentationView.vue'),
      meta: {
        title: 'Презентация',
      },
    },
    {
      path: '/dashboard/calendar',
      name: 'Calendar',
      component: () => import('../views/user-site/Others/Calendar.vue'),
      meta: {
        title: 'Календарь',
      },
    },
    {
      path: '/dashboard/tasks',
      name: 'Tasks',
      component: () => import('../views/user-site/Task/TaskKanban.vue'),
      meta: {
        title: 'Задачи',
      },
    },
    {
      path: '/dashboard/profile',
      name: 'Profile',
      component: () => import('../views/user-site/Others/UserProfile.vue'),
      meta: {
        title: 'Профиль',
      },
    },
    {
      path: '/dashboard/settings',
      name: 'AccountSettings',
      component: () => import('../views/user-site/Others/AccountSettings.vue'),
      meta: {
        title: 'Настройки аккаунта',
      },
    },
    {
      path: '/dashboard/form-elements',
      name: 'Form Elements',
      component: () => import('../views/user-site/Forms/FormElements.vue'),
      meta: {
        title: 'Элементы формы',
      },
    },
    {
      path: '/dashboard/basic-tables',
      name: 'Basic Tables',
      component: () => import('../views/user-site/Tables/BasicTables.vue'),
      meta: {
        title: 'Базовые таблицы',
      },
    },
    {
      path: '/dashboard/analytics',
      name: 'Analytics',
      component: () => import('../views/user-site/Pages/PlaceholderPage.vue'),
      meta: {
        title: 'Analytics',
      },
    },
    {
      path: '/dashboard/marketing',
      name: 'Marketing',
      component: () => import('../views/user-site/Pages/PlaceholderPage.vue'),
      meta: {
        title: 'Marketing',
      },
    },
    {
      path: '/dashboard/crm',
      name: 'Crm',
      component: () => import('../views/user-site/Pages/PlaceholderPage.vue'),
      meta: {
        title: 'CRM',
      },
    },
    {
      path: '/dashboard/data-tables',
      name: 'Data Tables',
      component: () => import('../views/user-site/Tables/DataTables.vue'),
      meta: {
        title: 'Data Tables',
      },
    },
    {
      path: '/dashboard/form-layout',
      name: 'Form Layout',
      component: () => import('../views/user-site/Forms/FormLayout.vue'),
      meta: {
        title: 'Макет формы',
      },
    },
    {
      path: '/dashboard/doughnut-chart',
      name: 'Doughnut Chart',
      component: () => import('../views/user-site/Pages/PlaceholderPage.vue'),
      meta: {
        title: 'Doughnut Chart',
      },
    },
    {
      path: '/dashboard/tariffs',
      name: 'Tariffs',
      component: () => import('../views/user-site/Tariffs/Tariffs.vue'),
      meta: {
        title: 'Тарифы',
      },
    },
    {
      path: '/dashboard/docs',
      name: 'Documentation',
      component: () => import('../views/user-site/Documentation/Documentation.vue'),
      meta: {
        title: 'Документация',
      },
    },
    {
      path: '/dashboard/search',
      name: 'Search',
      component: () => import('../views/user-site/Search/SearchResults.vue'),
      meta: {
        title: 'Поиск',
      },
    },
    {
      path: '/dashboard/support',
      name: 'Support',
      component: () => import('../views/user-site/Support/SupportList.vue'),
      meta: {
        title: 'Поддержка',
      },
    },
    {
      path: '/dashboard/support/:id',
      name: 'SupportTicket',
      component: () => import('../views/user-site/Support/SupportTicketView.vue'),
      meta: {
        title: 'Тикет',
      },
    },
    {
      path: '/dashboard/admin/users',
      name: 'Admin Users',
      component: () => import('../views/admin-site/Admin/AdminUsers.vue'),
      meta: {
        title: 'Пользователи',
        requiresAdmin: true,
      },
    },
    {
      path: '/dashboard/admin/presentations',
      name: 'Admin Presentations',
      component: () => import('../views/admin-site/Admin/AdminPresentations.vue'),
      meta: {
        title: 'Презентации',
        requiresAdmin: true,
      },
    },
    {
      path: '/dashboard/admin/tariffs',
      name: 'Admin Tariffs',
      component: () => import('../views/admin-site/Admin/AdminTariffs.vue'),
      meta: {
        title: 'Тарифы',
        requiresAdmin: true,
      },
    },
    {
      path: '/dashboard/admin/payments',
      name: 'Admin Payments',
      component: () => import('../views/admin-site/Admin/AdminPayments.vue'),
      meta: {
        title: 'Платежи',
        requiresAdmin: true,
      },
    },
    {
      path: '/dashboard/admin/requests',
      name: 'Admin Requests',
      component: () => import('../views/admin-site/Admin/AdminRequests.vue'),
      meta: {
        title: 'Запросы',
        requiresAdmin: true,
      },
    },
    {
      path: '/dashboard/admin/pages',
      name: 'Admin Pages',
      component: () => import('../views/admin-site/Admin/AdminPages.vue'),
      meta: {
        title: 'Настройка страниц',
        requiresAdmin: true,
      },
    },
    {
      path: '/dashboard/admin/pages/home',
      name: 'Admin Page Home',
      component: () => import('../views/admin-site/Admin/AdminPageHome.vue'),
      meta: {
        title: 'Главная страница',
        requiresAdmin: true,
      },
    },
    {
      path: '/dashboard/line-chart',
      name: 'Line Chart',
      component: () => import('../views/user-site/Chart/LineChart/LineChart.vue'),
    },
    {
      path: '/dashboard/bar-chart',
      name: 'Bar Chart',
      component: () => import('../views/user-site/Chart/BarChart/BarChart.vue'),
    },
    {
      path: '/dashboard/alerts',
      name: 'Alerts',
      component: () => import('../views/user-site/UiElements/Alerts.vue'),
      meta: {
        title: 'Оповещения',
      },
    },
    {
      path: '/dashboard/avatars',
      name: 'Avatars',
      component: () => import('../views/user-site/UiElements/Avatars.vue'),
      meta: {
        title: 'Аватары',
      },
    },
    {
      path: '/dashboard/badge',
      name: 'Badge',
      component: () => import('../views/user-site/UiElements/Badges.vue'),
      meta: {
        title: 'Значки',
      },
    },
    {
      path: '/dashboard/buttons',
      name: 'Buttons',
      component: () => import('../views/user-site/UiElements/Buttons.vue'),
      meta: {
        title: 'Кнопки',
      },
    },
    {
      path: '/dashboard/images',
      name: 'Images',
      component: () => import('../views/user-site/UiElements/Images.vue'),
      meta: {
        title: 'Изображения',
      },
    },
    {
      path: '/dashboard/videos',
      name: 'Videos',
      component: () => import('../views/user-site/UiElements/Videos.vue'),
      meta: {
        title: 'Видео',
      },
    },
    {
      path: '/dashboard/breadcrumb',
      name: 'Breadcrumb',
      component: () => import('../views/user-site/UiElements/Breadcrumbs.vue'),
      meta: {
        title: 'Breadcrumbs',
      },
    },
    {
      path: '/dashboard/cards',
      name: 'Cards',
      component: () => import('../views/user-site/UiElements/Cards.vue'),
      meta: {
        title: 'Cards',
      },
    },
    {
      path: '/dashboard/notifications-ui',
      name: 'Notifications UI',
      component: () => import('../views/user-site/UiElements/Notifications.vue'),
      meta: {
        title: 'Notifications',
      },
    },
    {
      path: '/dashboard/blank',
      name: 'Blank',
      component: () => import('../views/user-site/Pages/BlankPage.vue'),
      meta: {
        title: 'Пустая страница',
      },
    },
    {
      path: '/dashboard/faq',
      name: 'Faq',
      component: () => import('../views/user-site/Pages/Faq.vue'),
      meta: {
        title: 'FAQ',
      },
    },
    {
      path: '/dashboard/notifications',
      name: 'Notifications',
      component: () => import('../views/user-site/Pages/NotificationsPage.vue'),
      meta: {
        title: 'Уведомления',
      },
    },
    {
      path: '/dashboard/error-404',
      name: '404 Error',
      component: () => import('../views/user-site/Errors/FourZeroFour.vue'),
      meta: {
        title: 'Ошибка 404',
      },
    },
    {
      path: '/administration',
      name: 'Administration',
      component: () => import('../views/admin-site/Administration/AdministrationIndex.vue'),
      meta: {
        title: 'Администрирование',
      },
    },
    {
      path: '/signin',
      name: 'Signin',
      component: () => import('../views/user-site/Auth/Signin.vue'),
      meta: {
        title: 'Вход',
      },
    },
    {
      path: '/signin/2fa',
      name: 'SigninTwoFactor',
      component: () => import('../views/user-site/Auth/SigninTwoFactor.vue'),
      meta: {
        title: 'Подтверждение 2FA',
      },
    },
    {
      path: '/signup',
      name: 'Signup',
      component: () => import('../views/user-site/Auth/Signup.vue'),
      meta: {
        title: 'Регистрация',
      },
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('../views/user-site/Auth/ResetPassword.vue'),
      meta: {
        title: 'Восстановление пароля',
      },
    },
    {
      path: '/verify',
      name: 'TwoStepVerification',
      component: () => import('../views/user-site/Auth/TwoStepVerification.vue'),
      meta: {
        title: 'Подтверждение',
      },
    },
    {
      path: '/maintenance',
      name: 'Maintenance',
      component: () => import('../views/user-site/Maintenance.vue'),
      meta: {
        title: 'Сайт в разработке',
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

router.beforeEach(async (to, from, next) => {
  if (to.path === '/signin') {
    const rawRedirect = to.query.redirect
    if (typeof rawRedirect === 'string') {
      const sanitizedRedirect = sanitizeRedirectTarget(rawRedirect, '')
      if (sanitizedRedirect !== rawRedirect) {
        next(sanitizedRedirect ? { path: '/signin', query: { redirect: sanitizedRedirect } } : { path: '/signin' })
        return
      }
    }
  }

  const token = getToken()

  // Страница «Сайт в разработке» — всегда разрешена
  if (to.path === '/maintenance') {
    const title = to.meta?.title
    document.title = title ? `${String(title)} | E-Presentation` : 'E-Presentation'
    next()
    return
  }

  // Проверка рубильника «сайт отключён» (только для админа доступен полный сайт)
  if (hasApi()) try {
    const base = getApiBase()
    const statusUrl = base ? `${base}/api/site/status` : '/api/site/status'
    const res = await fetch(statusUrl)
    const data = await res.json().catch(() => ({}))
    const siteDisabled = !!data?.siteDisabled

    if (siteDisabled) {
      // Вход, регистрация и подтверждение разрешены
      if (to.path === '/signin' || to.path === '/signin/2fa' || to.path === '/signup' || to.path === '/verify' || to.path === '/reset-password') {
        const title = to.meta?.title
        document.title = title ? `${String(title)} | E-Presentation` : 'E-Presentation'
        next()
        return
      }
      if (!token) {
        next({ path: '/maintenance' })
        return
      }
      const user = await api.get<{ role_id?: number }>('/api/auth/me')
      if (user.role_id !== 2) {
        next({ path: '/maintenance' })
        return
      }
      // Админ — пропускаем
    }
  } catch {
    // Ошибка запроса статуса — не блокируем навигацию
  }

  const requiresAuth = to.path.startsWith('/dashboard') || to.path === '/administration'
  if (requiresAuth && !token) {
    const redirect = sanitizeRedirectTarget(to.fullPath, '/dashboard')
    next({ path: '/signin', query: { redirect } })
    return
  }
  const requiresAdmin = to.meta?.requiresAdmin === true
  if (requiresAdmin && token) {
    try {
      const user = await api.get<{ role_id?: number }>('/api/auth/me')
      if (user.role_id !== 2) {
        next({ path: '/dashboard' })
        return
      }
    } catch {
      const redirect = sanitizeRedirectTarget(to.fullPath, '/dashboard')
      next({ path: '/signin', query: { redirect } })
      return
    }
  }
  const title = to.meta?.title
  document.title = title ? `${String(title)} | E-Presentation` : 'E-Presentation'
  next()
})


