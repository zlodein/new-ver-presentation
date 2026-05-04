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
    /* РЇРєРѕСЂСЏ #block-N РѕР±СЂР°Р±Р°С‚С‹РІР°РµС‚ PresentationView РїРѕСЃР»Рµ Р·Р°РіСЂСѓР·РєРё СЃР»Р°Р№РґРѕРІ */
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
        title: 'РўР°СЂРёС„С‹',
      },
    },
    {
      path: '/privacy',
      name: 'PrivacyPolicy',
      component: () => import('../views/public-site/Legal/PrivacyPolicy.vue'),
      meta: {
        title: 'РџРѕР»РёС‚РёРєР° РєРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚Рё',
      },
    },
    {
      path: '/terms',
      name: 'TermsConditions',
      component: () => import('../views/public-site/Legal/TermsConditions.vue'),
      meta: {
        title: 'РџСЂР°РІРёР»Р° Рё СѓСЃР»РѕРІРёСЏ',
      },
    },
    {
      path: '/dashboard',
      name: 'Ecommerce',
      component: () => import('../views/user-site/Ecommerce.vue'),
      meta: {
        title: 'РџР°РЅРµР»СЊ СѓРїСЂР°РІР»РµРЅРёСЏ',
      },
    },
    {
      path: '/dashboard/presentations',
      name: 'Presentations',
      component: () => import('../views/user-site/Presentations/PresentationsList.vue'),
      meta: {
        title: 'РџСЂРµР·РµРЅС‚Р°С†РёРё',
      },
    },
    {
      path: '/dashboard/presentations/new',
      name: 'PresentationNew',
      component: () => import('../views/editor/PresentationEditor.vue'),
      meta: {
        title: 'РќРѕРІР°СЏ РїСЂРµР·РµРЅС‚Р°С†РёСЏ',
      },
    },
    {
      path: '/dashboard/presentations/:id/edit',
      name: 'PresentationEdit',
      component: () => import('../views/editor/PresentationEditor.vue'),
      meta: {
        title: 'Р РµРґР°РєС‚РѕСЂ РїСЂРµР·РµРЅС‚Р°С†РёРё',
      },
    },
    {
      path: '/dashboard/presentations/:id/view',
      name: 'PresentationViewOwner',
      component: () => import('../views/viewer/PresentationView.vue'),
      meta: {
        title: 'РџСЂРѕСЃРјРѕС‚СЂ РїСЂРµР·РµРЅС‚Р°С†РёРё',
      },
    },
    {
      path: '/view/:shortId/:slug',
      name: 'PresentationViewPublicSlug',
      component: () => import('../views/viewer/PresentationView.vue'),
      meta: {
        title: 'РџСЂРµР·РµРЅС‚Р°С†РёСЏ',
      },
    },
    {
      path: '/view/:hash',
      name: 'PresentationViewPublic',
      component: () => import('../views/viewer/PresentationView.vue'),
      meta: {
        title: 'РџСЂРµР·РµРЅС‚Р°С†РёСЏ',
      },
    },
    {
      path: '/dashboard/calendar',
      name: 'Calendar',
      component: () => import('../views/user-site/Others/Calendar.vue'),
      meta: {
        title: 'РљР°Р»РµРЅРґР°СЂСЊ',
      },
    },
    {
      path: '/dashboard/tasks',
      name: 'Tasks',
      component: () => import('../views/user-site/Task/TaskKanban.vue'),
      meta: {
        title: 'Р—Р°РґР°С‡Рё',
      },
    },
    {
      path: '/dashboard/profile',
      name: 'Profile',
      component: () => import('../views/user-site/Others/UserProfile.vue'),
      meta: {
        title: 'РџСЂРѕС„РёР»СЊ',
      },
    },
    {
      path: '/dashboard/settings',
      name: 'AccountSettings',
      component: () => import('../views/user-site/Others/AccountSettings.vue'),
      meta: {
        title: 'РќР°СЃС‚СЂРѕР№РєРё Р°РєРєР°СѓРЅС‚Р°',
      },
    },
    {
      path: '/dashboard/form-elements',
      name: 'Form Elements',
      component: () => import('../views/user-site/Forms/FormElements.vue'),
      meta: {
        title: 'Р­Р»РµРјРµРЅС‚С‹ С„РѕСЂРјС‹',
      },
    },
    {
      path: '/dashboard/basic-tables',
      name: 'Basic Tables',
      component: () => import('../views/user-site/Tables/BasicTables.vue'),
      meta: {
        title: 'Р‘Р°Р·РѕРІС‹Рµ С‚Р°Р±Р»РёС†С‹',
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
        title: 'РњР°РєРµС‚ С„РѕСЂРјС‹',
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
        title: 'РўР°СЂРёС„С‹',
      },
    },
    {
      path: '/dashboard/docs',
      name: 'Documentation',
      component: () => import('../views/user-site/Documentation/Documentation.vue'),
      meta: {
        title: 'Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ',
      },
    },
    {
      path: '/dashboard/search',
      name: 'Search',
      component: () => import('../views/user-site/Search/SearchResults.vue'),
      meta: {
        title: 'РџРѕРёСЃРє',
      },
    },
    {
      path: '/dashboard/support',
      name: 'Support',
      component: () => import('../views/user-site/Support/SupportList.vue'),
      meta: {
        title: 'РџРѕРґРґРµСЂР¶РєР°',
      },
    },
    {
      path: '/dashboard/support/:id',
      name: 'SupportTicket',
      component: () => import('../views/user-site/Support/SupportTicketView.vue'),
      meta: {
        title: 'РўРёРєРµС‚',
      },
    },
    {
      path: '/dashboard/admin/users',
      name: 'Admin Users',
      component: () => import('../views/admin-site/Admin/AdminUsers.vue'),
      meta: {
        title: 'РџРѕР»СЊР·РѕРІР°С‚РµР»Рё',
        requiresAdmin: true,
      },
    },
    {
      path: '/dashboard/admin/presentations',
      name: 'Admin Presentations',
      component: () => import('../views/admin-site/Admin/AdminPresentations.vue'),
      meta: {
        title: 'РџСЂРµР·РµРЅС‚Р°С†РёРё',
        requiresAdmin: true,
      },
    },
    {
      path: '/dashboard/admin/tariffs',
      name: 'Admin Tariffs',
      component: () => import('../views/admin-site/Admin/AdminTariffs.vue'),
      meta: {
        title: 'РўР°СЂРёС„С‹',
        requiresAdmin: true,
      },
    },
    {
      path: '/dashboard/admin/payments',
      name: 'Admin Payments',
      component: () => import('../views/admin-site/Admin/AdminPayments.vue'),
      meta: {
        title: 'РџР»Р°С‚РµР¶Рё',
        requiresAdmin: true,
      },
    },
    {
      path: '/dashboard/admin/requests',
      name: 'Admin Requests',
      component: () => import('../views/admin-site/Admin/AdminRequests.vue'),
      meta: {
        title: 'Р—Р°РїСЂРѕСЃС‹',
        requiresAdmin: true,
      },
    },
    {
      path: '/dashboard/admin/pages',
      name: 'Admin Pages',
      component: () => import('../views/admin-site/Admin/AdminPages.vue'),
      meta: {
        title: 'РќР°СЃС‚СЂРѕР№РєР° СЃС‚СЂР°РЅРёС†',
        requiresAdmin: true,
      },
    },
    {
      path: '/dashboard/admin/pages/home',
      name: 'Admin Page Home',
      component: () => import('../views/admin-site/Admin/AdminPageHome.vue'),
      meta: {
        title: 'Р“Р»Р°РІРЅР°СЏ СЃС‚СЂР°РЅРёС†Р°',
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
        title: 'РћРїРѕРІРµС‰РµРЅРёСЏ',
      },
    },
    {
      path: '/dashboard/avatars',
      name: 'Avatars',
      component: () => import('../views/user-site/UiElements/Avatars.vue'),
      meta: {
        title: 'РђРІР°С‚Р°СЂС‹',
      },
    },
    {
      path: '/dashboard/badge',
      name: 'Badge',
      component: () => import('../views/user-site/UiElements/Badges.vue'),
      meta: {
        title: 'Р—РЅР°С‡РєРё',
      },
    },
    {
      path: '/dashboard/buttons',
      name: 'Buttons',
      component: () => import('../views/user-site/UiElements/Buttons.vue'),
      meta: {
        title: 'РљРЅРѕРїРєРё',
      },
    },
    {
      path: '/dashboard/images',
      name: 'Images',
      component: () => import('../views/user-site/UiElements/Images.vue'),
      meta: {
        title: 'РР·РѕР±СЂР°Р¶РµРЅРёСЏ',
      },
    },
    {
      path: '/dashboard/videos',
      name: 'Videos',
      component: () => import('../views/user-site/UiElements/Videos.vue'),
      meta: {
        title: 'Р’РёРґРµРѕ',
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
        title: 'РџСѓСЃС‚Р°СЏ СЃС‚СЂР°РЅРёС†Р°',
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
        title: 'РЈРІРµРґРѕРјР»РµРЅРёСЏ',
      },
    },
    {
      path: '/dashboard/error-404',
      name: '404 Error',
      component: () => import('../views/user-site/Errors/FourZeroFour.vue'),
      meta: {
        title: 'РћС€РёР±РєР° 404',
      },
    },
    {
      path: '/administration',
      name: 'Administration',
      component: () => import('../views/admin-site/Administration/AdministrationIndex.vue'),
      meta: {
        title: 'РђРґРјРёРЅРёСЃС‚СЂРёСЂРѕРІР°РЅРёРµ',
      },
    },
    {
      path: '/signin',
      name: 'Signin',
      component: () => import('../views/user-site/Auth/Signin.vue'),
      meta: {
        title: 'Р’С…РѕРґ',
      },
    },
    {
      path: '/signin/2fa',
      name: 'SigninTwoFactor',
      component: () => import('../views/user-site/Auth/SigninTwoFactor.vue'),
      meta: {
        title: 'РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ 2FA',
      },
    },
    {
      path: '/signup',
      name: 'Signup',
      component: () => import('../views/user-site/Auth/Signup.vue'),
      meta: {
        title: 'Р РµРіРёСЃС‚СЂР°С†РёСЏ',
      },
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('../views/user-site/Auth/ResetPassword.vue'),
      meta: {
        title: 'Р’РѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµ РїР°СЂРѕР»СЏ',
      },
    },
    {
      path: '/verify',
      name: 'TwoStepVerification',
      component: () => import('../views/user-site/Auth/TwoStepVerification.vue'),
      meta: {
        title: 'РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ',
      },
    },
    {
      path: '/maintenance',
      name: 'Maintenance',
      component: () => import('../views/user-site/Maintenance.vue'),
      meta: {
        title: 'РЎР°Р№С‚ РІ СЂР°Р·СЂР°Р±РѕС‚РєРµ',
      },
    },
    // Р’СЃРµ РЅРµРёР·РІРµСЃС‚РЅС‹Рµ РїСѓС‚Рё вЂ” СЂРµРґРёСЂРµРєС‚ РЅР° СЃС‚СЂР°РЅРёС†Сѓ 404
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      redirect: () => ({ path: '/dashboard/error-404' }),
      meta: {
        title: 'РћС€РёР±РєР° 404',
      },
    },
  ],
})

// РћР±СЂР°Р±РѕС‚РєР° 404 РїСЂРё Р·Р°РіСЂСѓР·РєРµ С‡Р°РЅРєРѕРІ (РїРѕСЃР»Рµ РґРµРїР»РѕСЏ СЃС‚Р°СЂС‹Рµ URL С‡Р°РЅРєРѕРІ РїРµСЂРµСЃС‚Р°СЋС‚ СЂР°Р±РѕС‚Р°С‚СЊ)
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

  // РЎС‚СЂР°РЅРёС†Р° В«РЎР°Р№С‚ РІ СЂР°Р·СЂР°Р±РѕС‚РєРµВ» вЂ” РІСЃРµРіРґР° СЂР°Р·СЂРµС€РµРЅР°
  if (to.path === '/maintenance') {
    const title = to.meta?.title
    document.title = title ? `${String(title)} | E-Presentation` : 'E-Presentation'
    next()
    return
  }

  // РџСЂРѕРІРµСЂРєР° СЂСѓР±РёР»СЊРЅРёРєР° В«СЃР°Р№С‚ РѕС‚РєР»СЋС‡С‘РЅВ» (С‚РѕР»СЊРєРѕ РґР»СЏ Р°РґРјРёРЅР° РґРѕСЃС‚СѓРїРµРЅ РїРѕР»РЅС‹Р№ СЃР°Р№С‚)
  if (hasApi()) try {
    const base = getApiBase()
    const statusUrl = base ? `${base}/api/site/status` : '/api/site/status'
    const res = await fetch(statusUrl)
    const data = await res.json().catch(() => ({}))
    const siteDisabled = !!data?.siteDisabled

    if (siteDisabled) {
      // Р’С…РѕРґ, СЂРµРіРёСЃС‚СЂР°С†РёСЏ Рё РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ СЂР°Р·СЂРµС€РµРЅС‹
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
      // РђРґРјРёРЅ вЂ” РїСЂРѕРїСѓСЃРєР°РµРј
    }
  } catch {
    // РћС€РёР±РєР° Р·Р°РїСЂРѕСЃР° СЃС‚Р°С‚СѓСЃР° вЂ” РЅРµ Р±Р»РѕРєРёСЂСѓРµРј РЅР°РІРёРіР°С†РёСЋ
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

