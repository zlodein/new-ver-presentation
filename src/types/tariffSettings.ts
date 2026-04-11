/** Настройки текстов и цен на странице тарифов (server/data/tariff-settings.json). */

export interface TariffDiscountTier {
  from: number
  to: number
  percent: number
}

export interface TariffTestDriveContent {
  title: string
  priceMain: string
  priceHint: string
  description: string
  /** Строки с галочкой */
  bullets: string[]
  /** Строки с крестиком (ограничения) */
  restrictions: string[]
  ctaLoggedOut: string
  ctaLoggedInAvailable: string
  ctaLoggedInUnavailable: string
}

export interface TariffExpertContent {
  title: string
  basePrice: number
  maxDiscountPercent: number
  discountTiers: TariffDiscountTier[]
  /** При скидке 0%: подставляются {basePrice}, {maxPct} */
  discountDescriptionZero: string
  /** При скидке > 0: {q}, {wordGenitive} («презентации»/«презентациях»), {pct}, {maxPct} */
  discountDescriptionWithPct: string
  features: string[]
  ctaLoggedOut: string
  ctaLoggedInTestDrive: string
  ctaLoggedInOther: string
}

export interface TariffPageSettings {
  pageTitle: string
  introChooseTariff: string
  introLoggedInHasTariff: string
  introLoggedInNoTariff: string
  introPublicLogin: string
  testDrive: TariffTestDriveContent
  expert: TariffExpertContent
}

export const DEFAULT_TARIFF_PAGE_SETTINGS: TariffPageSettings = {
  pageTitle: 'Тарифы: максимум возможностей для каждого!',
  introChooseTariff: 'Выберите тариф для начала работы',
  introLoggedInHasTariff: 'Сменить тариф на «{expert}» можно ниже для снятия ограничений.',
  introLoggedInNoTariff: 'Выберите тариф для начала работы',
  introPublicLogin:
    'Войдите или зарегистрируйтесь, чтобы выбрать тариф и оплатить. После авторизации тариф будет присвоен вашему аккаунту.',
  testDrive: {
    title: 'Тест драйв',
    priceMain: 'Бесплатно',
    priceHint: 'один раз',
    description: 'Ознакомление с возможностями сервиса: одна презентация, до 4 слайдов, без публичной ссылки.',
    bullets: ['1 презентация', 'До 4 слайдов суммарно', 'Без публичной ссылки'],
    restrictions: ['Задачи и календарь недоступны'],
    ctaLoggedOut: 'Войти и выбрать тест драйв',
    ctaLoggedInAvailable: 'Выбрать тест драйв',
    ctaLoggedInUnavailable: 'Доступен только один раз',
  },
  expert: {
    title: 'Эксперт',
    basePrice: 900,
    maxDiscountPercent: 20,
    discountTiers: [
      { from: 1, to: 1, percent: 0 },
      { from: 2, to: 4, percent: 5 },
      { from: 5, to: 9, percent: 10 },
      { from: 10, to: 19, percent: 15 },
      { from: 20, to: 100, percent: 20 },
    ],
    discountDescriptionZero:
      '{basePrice} ₽ за презентацию. Динамическая система скидок в зависимости от количества, максимальная скидка {maxPct}%.',
    discountDescriptionWithPct:
      'Динамическая система скидок: при {q} {wordGenitive} — скидка {pct}%. Максимальный процент скидки {maxPct}%.',
    features: [
      'Выбранное количество презентаций: {q}',
      'Неограниченное количество слайдов',
      'Публичная ссылка на презентацию',
      'Задачи и календарь',
    ],
    ctaLoggedOut: 'Войти и оплатить тариф Эксперт',
    ctaLoggedInTestDrive: 'Сменить на Эксперт',
    ctaLoggedInOther: 'Выбрать Эксперт',
  },
}

export function discountPercentFromTiers(quantity: number, tiers: TariffDiscountTier[]): number {
  const q = Math.max(1, Math.min(100, Math.floor(quantity) || 1))
  for (const t of tiers) {
    if (q >= t.from && q <= t.to) return t.percent
  }
  return 0
}

export function mergeTariffPageSettings(raw: Partial<TariffPageSettings> | null | undefined): TariffPageSettings {
  const d = DEFAULT_TARIFF_PAGE_SETTINGS
  if (!raw || typeof raw !== 'object') return { ...d, testDrive: { ...d.testDrive }, expert: { ...d.expert, discountTiers: [...d.expert.discountTiers] } }
  const testDrive = {
    ...d.testDrive,
    ...(raw.testDrive && typeof raw.testDrive === 'object' ? raw.testDrive : {}),
    bullets: Array.isArray(raw.testDrive?.bullets) ? raw.testDrive!.bullets! : d.testDrive.bullets,
    restrictions: Array.isArray(raw.testDrive?.restrictions) ? raw.testDrive!.restrictions! : d.testDrive.restrictions,
  }
  const expertRaw = (raw.expert && typeof raw.expert === 'object' ? raw.expert : {}) as Partial<TariffExpertContent>
  const tiers = Array.isArray(expertRaw.discountTiers) && expertRaw.discountTiers.length > 0
    ? expertRaw.discountTiers.map((t: TariffDiscountTier) => ({
        from: Number(t.from) || 1,
        to: Number(t.to) || 1,
        percent: Number(t.percent) || 0,
      }))
    : [...d.expert.discountTiers]
  const basePriceRaw = expertRaw.basePrice as number | string | undefined
  const maxPctRaw = expertRaw.maxDiscountPercent as number | string | undefined
  const expert = {
    ...d.expert,
    ...expertRaw,
    basePrice:
      typeof basePriceRaw === 'number'
        ? basePriceRaw
        : typeof basePriceRaw === 'string' && basePriceRaw.trim() !== ''
          ? Number(basePriceRaw) || d.expert.basePrice
          : d.expert.basePrice,
    maxDiscountPercent:
      typeof maxPctRaw === 'number'
        ? maxPctRaw
        : typeof maxPctRaw === 'string' && maxPctRaw.trim() !== ''
          ? Number(maxPctRaw) || d.expert.maxDiscountPercent
          : d.expert.maxDiscountPercent,
    discountTiers: tiers,
    features: Array.isArray(expertRaw.features) ? expertRaw.features : d.expert.features,
  }
  return {
    pageTitle: typeof raw.pageTitle === 'string' && raw.pageTitle.trim() ? raw.pageTitle : d.pageTitle,
    introChooseTariff:
      typeof raw.introChooseTariff === 'string' && raw.introChooseTariff.trim()
        ? raw.introChooseTariff
        : d.introChooseTariff,
    introLoggedInHasTariff:
      typeof raw.introLoggedInHasTariff === 'string' && raw.introLoggedInHasTariff.trim()
        ? raw.introLoggedInHasTariff
        : d.introLoggedInHasTariff,
    introLoggedInNoTariff:
      typeof raw.introLoggedInNoTariff === 'string' && raw.introLoggedInNoTariff.trim()
        ? raw.introLoggedInNoTariff
        : d.introLoggedInNoTariff,
    introPublicLogin:
      typeof raw.introPublicLogin === 'string' && raw.introPublicLogin.trim()
        ? raw.introPublicLogin
        : d.introPublicLogin,
    testDrive,
    expert,
  }
}
