import { ref, computed } from 'vue'
import { api, hasApi } from '@/api/client'
import {
  type TariffPageSettings,
  mergeTariffPageSettings,
  discountPercentFromTiers,
} from '@/types/tariffSettings'

export function useTariffPlansSettings() {
  const raw = ref<Partial<TariffPageSettings> | null>(null)

  const cfg = computed(() => mergeTariffPageSettings(raw.value))

  async function load() {
    if (!hasApi()) return
    try {
      const r = await api.get<{ settings: Partial<TariffPageSettings> }>('/api/site/tariff-settings')
      raw.value = r?.settings && typeof r.settings === 'object' ? r.settings : null
    } catch {
      raw.value = null
    }
  }

  function expertDiscountPercent(quantity: number): number {
    return discountPercentFromTiers(quantity, cfg.value.expert.discountTiers)
  }

  function expertTotal(quantity: number): number {
    const q = Math.max(1, Math.min(100, Math.floor(quantity) || 1))
    const base = cfg.value.expert.basePrice
    const discount = expertDiscountPercent(q) / 100
    return Math.round(q * base * (1 - discount))
  }

  function pluralize(n: number, one: string, few: string, many: string): string {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return one
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
    return many
  }

  function wordGenitivePresentations(q: number): string {
    return q === 1 ? 'презентации' : 'презентациях'
  }

  function expertDiscountDescriptionText(q: number): string {
    const pct = expertDiscountPercent(q)
    const maxPct = cfg.value.expert.maxDiscountPercent
    const base = cfg.value.expert.basePrice
    if (pct === 0) {
      return cfg.value.expert.discountDescriptionZero
        .replace(/\{basePrice\}/g, String(base))
        .replace(/\{maxPct\}/g, String(maxPct))
    }
    return cfg.value.expert.discountDescriptionWithPct
      .replace(/\{q\}/g, String(q))
      .replace(/\{wordGenitive\}/g, wordGenitivePresentations(q))
      .replace(/\{pct\}/g, String(pct))
      .replace(/\{maxPct\}/g, String(maxPct))
  }

  function expertFeatureLine(template: string, q: number): string {
    return template.replace(/\{q\}/g, String(q))
  }

  function tariffShortLabel(t: string | null | undefined): string {
    if (t === 'test_drive') return cfg.value.testDrive.title
    if (t === 'expert') return cfg.value.expert.title
    return ''
  }

  function replaceExpertPlaceholder(text: string): string {
    return text.replace(/\{expert\}/g, cfg.value.expert.title)
  }

  return {
    raw,
    cfg,
    load,
    expertDiscountPercent,
    expertTotal,
    pluralize,
    expertDiscountDescriptionText,
    expertFeatureLine,
    tariffShortLabel,
    replaceExpertPlaceholder,
  }
}
