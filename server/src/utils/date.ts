/**
 * Часовой пояс сервера (смещение в часах относительно UTC).
 * Если в БД и на сервере время хранится/работает в +3 (Москва), но драйвер БД
 * отдаёт даты как UTC, на клиенте время отображается ещё +3 часа.
 * Укажите здесь смещение сервера (например 3 для Москвы), чтобы даты из БД
 * корректно конвертировались в UTC для API.
 * Пример в .env: SERVER_TIMEZONE_OFFSET_HOURS=3
 */
const SERVER_TZ_OFFSET_HOURS = Number(process.env.SERVER_TIMEZONE_OFFSET_HOURS ?? 0) || 0
const OFFSET_MS = SERVER_TZ_OFFSET_HOURS * 60 * 60 * 1000

/**
 * Возвращает дату в ISO строке (UTC) для ответов API.
 * Если задан SERVER_TIMEZONE_OFFSET_HOURS, считаем что Date из БД — это
 * локальное время сервера, ошибочно интерпретированное как UTC; вычитаем
 * смещение, чтобы получить правильный UTC и отобразить на клиенте верное время.
 */
export function toIsoDate(d: Date | string | null | undefined): string | undefined {
  if (d == null) return undefined
  if (typeof d === 'string') return d
  const corrected = OFFSET_MS !== 0 ? new Date(d.getTime() - OFFSET_MS) : d
  return corrected.toISOString()
}

/** То же для обязательной строки (например calendar). */
export function toIsoDateRequired(d: Date | string): string {
  if (typeof d === 'string') return d
  const corrected = OFFSET_MS !== 0 ? new Date(d.getTime() - OFFSET_MS) : d
  return corrected.toISOString()
}
