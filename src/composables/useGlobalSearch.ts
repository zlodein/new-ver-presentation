import { ref, type Ref } from 'vue'
import { api, hasApi, getToken } from '@/api/client'
import type { PresentationListItem } from '@/api/client'
import { docSections, getDocSectionPlainText } from '@/data/documentationSections'

export interface SearchResultItem {
  id: string
  title: string
  subtitle?: string
  link: string
}

export interface GlobalSearchResults {
  presentations: SearchResultItem[]
  calendar: SearchResultItem[]
  tasks: SearchResultItem[]
  documentation: SearchResultItem[]
}

function matchQuery(text: string | undefined, q: string): boolean {
  if (!text || !q) return false
  const lower = text.toLowerCase().trim()
  const query = q.toLowerCase().trim()
  return lower.includes(query)
}

export function useGlobalSearch() {
  const loading = ref(false)
  const error = ref('')

  async function search(query: string): Promise<GlobalSearchResults> {
    const q = (query || '').trim()
    const empty: GlobalSearchResults = {
      presentations: [],
      calendar: [],
      tasks: [],
      documentation: [],
    }
    if (!q) return empty

    loading.value = true
    error.value = ''

    const results: GlobalSearchResults = {
      presentations: [],
      calendar: [],
      tasks: [],
      documentation: [],
    }

    try {
      // Документация — всегда локальный поиск
      const docPlain = docSections.map((s) => ({
        ...s,
        plain: getDocSectionPlainText(s.content),
      }))
      results.documentation = docPlain
        .filter((s) => matchQuery(s.title, q) || matchQuery(s.plain, q))
        .map((s) => ({
          id: s.id,
          title: s.title,
          subtitle: undefined,
          link: `/dashboard/docs#${s.id}`,
        }))

      if (!hasApi() || !getToken()) {
        loading.value = false
        return results
      }

      const [presentationsRes, calendarRes, tasksRes] = await Promise.allSettled([
        api.get<PresentationListItem[]>(`/api/presentations${q ? `?q=${encodeURIComponent(q)}` : ''}`),
        api.get<Array<{ id: string; title: string; start?: string; end?: string; extendedProps?: { notes?: string } }>>('/api/calendar/events'),
        api.get<Array<{ id: string; title: string; description?: string; status?: string; tag?: string }>>('/api/tasks'),
      ])

      if (presentationsRes.status === 'fulfilled') {
        const list = presentationsRes.value
        results.presentations = list.map((p) => ({
            id: String(p.id),
            title: p.title || 'Без названия',
            subtitle: p.updatedAt ? `Обновлено: ${new Date(p.updatedAt).toLocaleDateString('ru-RU')}` : undefined,
            link: `/dashboard/presentations/${p.id}/edit`,
          }))
      }

      if (calendarRes.status === 'fulfilled') {
        const list = calendarRes.value
        results.calendar = list
          .filter(
            (e) =>
              matchQuery(e.title, q) || matchQuery(e.extendedProps?.notes, q)
          )
          .map((e) => {
            const start = e.start ? new Date(e.start) : null
            const subtitle = start ? start.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : undefined
            return {
              id: String(e.id),
              title: e.title || 'Событие',
              subtitle,
              link: `/dashboard/calendar?eventId=${encodeURIComponent(e.id)}`,
            }
          })
      }

      if (tasksRes.status === 'fulfilled') {
        const list = tasksRes.value
        results.tasks = list
          .filter(
            (t) =>
              matchQuery(t.title, q) ||
              matchQuery(t.description, q) ||
              matchQuery(t.tag, q)
          )
          .map((t) => ({
            id: String(t.id),
            title: t.title || 'Задача',
            subtitle: t.status ? `Статус: ${t.status}` : undefined,
            link: '/dashboard/tasks',
          }))
      }

      return results
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка поиска'
      return results
    } finally {
      loading.value = false
    }
  }

  return { search, loading: loading as Ref<boolean>, error: error as Ref<string> }
}
