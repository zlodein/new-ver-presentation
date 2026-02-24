/**
 * Шаблоны писем для уведомлений на info@e-presentation.ru
 */

const SITE_NAME = 'E-Presentation'

function wrapHtml(body: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { color: #2c7f8d; font-size: 18px; font-weight: 600; margin-bottom: 20px; }
    .block { margin-bottom: 16px; }
    .label { font-weight: 600; color: #555; }
    .footer { margin-top: 24px; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="header">${SITE_NAME}</div>
  ${body}
  <div class="footer">Это автоматическое уведомление. Не отвечайте на это письмо.</div>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Шаблон: новый пользователь зарегистрировался */
export function getRegistrationEmail(data: { email: string; name?: string | null; lastName?: string | null }) {
  const fullName = [data.name, data.lastName].filter(Boolean).join(' ').trim() || '—'
  const title = 'Новая регистрация на сайте'
  const body = `
    <h2>Новая регистрация</h2>
    <div class="block"><span class="label">Email:</span> ${escapeHtml(data.email)}</div>
    <div class="block"><span class="label">Имя:</span> ${escapeHtml(fullName)}</div>
    <div class="block"><span class="label">Дата:</span> ${escapeHtml(new Date().toLocaleString('ru-RU'))}</div>
  `
  return { subject: `[${SITE_NAME}] ${title}`, html: wrapHtml(body, title) }
}

/** Шаблон: оплата тарифа */
export function getPaymentEmail(data: {
  email: string
  name?: string | null
  lastName?: string | null
  tariffName: string
  amount?: string | number
  paymentId?: string
}) {
  const fullName = [data.name, data.lastName].filter(Boolean).join(' ').trim() || '—'
  const title = 'Оплата тарифа'
  const body = `
    <h2>Оплата тарифа</h2>
    <div class="block"><span class="label">Пользователь:</span> ${escapeHtml(fullName)}</div>
    <div class="block"><span class="label">Email:</span> ${escapeHtml(data.email)}</div>
    <div class="block"><span class="label">Тариф:</span> ${escapeHtml(String(data.tariffName))}</div>
    ${data.amount != null ? `<div class="block"><span class="label">Сумма:</span> ${escapeHtml(String(data.amount))}</div>` : ''}
    ${data.paymentId ? `<div class="block"><span class="label">ID платежа:</span> ${escapeHtml(data.paymentId)}</div>` : ''}
    <div class="block"><span class="label">Дата:</span> ${escapeHtml(new Date().toLocaleString('ru-RU'))}</div>
  `
  return { subject: `[${SITE_NAME}] ${title} — ${data.email}`, html: wrapHtml(body, title) }
}

/** Шаблон: запрос от пользователя (тикет поддержки) */
export function getSupportRequestEmail(data: {
  userEmail: string
  userName?: string | null
  subject: string
  message?: string | null
  ticketId?: string
}) {
  const title = 'Запрос от пользователя'
  const body = `
    <h2>Новый запрос в поддержку</h2>
    ${data.ticketId ? `<div class="block"><span class="label">Тикет:</span> ${escapeHtml(data.ticketId)}</div>` : ''}
    <div class="block"><span class="label">От:</span> ${escapeHtml(data.userName || data.userEmail)}</div>
    <div class="block"><span class="label">Email:</span> ${escapeHtml(data.userEmail)}</div>
    <div class="block"><span class="label">Тема:</span> ${escapeHtml(data.subject)}</div>
    ${data.message ? `<div class="block"><span class="label">Сообщение:</span><br><pre style="white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:6px;">${escapeHtml(data.message)}</pre></div>` : ''}
    <div class="block"><span class="label">Дата:</span> ${escapeHtml(new Date().toLocaleString('ru-RU'))}</div>
  `
  return { subject: `[${SITE_NAME}] ${title} — ${data.subject}`, html: wrapHtml(body, title) }
}
