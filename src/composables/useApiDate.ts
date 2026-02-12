/**
 * Форматирование дат, приходящих с API.
 * Время с бэкенда приходит в UTC (или в «серверном» поясе, но с суффиксом Z).
 * toLocaleString() добавляет локальный пояс браузера, из-за чего получается двойной сдвиг (+3 и ещё +3).
 * Форматируем по UTC-компонентам строки, чтобы показывать время «как на сервере» без лишнего сдвига.
 */
function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

const MONTHS_RU = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

/**
 * Дата из API → строка вида "12 фев. 2025" (без сдвига по локальному поясу).
 */
export function formatApiDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const day = pad2(d.getUTCDate())
  const month = MONTHS_RU[d.getUTCMonth()]
  const year = d.getUTCFullYear()
  return `${day} ${month}. ${year}`
}

/**
 * Дата и время из API → строка вида "12 фев. 2025, 15:42" (без сдвига по локальному поясу).
 */
export function formatApiDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const day = pad2(d.getUTCDate())
  const month = MONTHS_RU[d.getUTCMonth()]
  const year = d.getUTCFullYear()
  const hours = pad2(d.getUTCHours())
  const minutes = pad2(d.getUTCMinutes())
  return `${day} ${month}. ${year}, ${hours}:${minutes}`
}
