/**
 * Шаблоны писем для уведомлений на info@e-presentation.ru
 * Стилизация по образцу examples-templates.php
 */

const SITE_NAME = 'E-Presentation'

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type WrapOptions = {
  headerTitle: string
  headerColor?: string
  badge?: { text: string; class: string }
}

function wrapHtml(body: string, title: string, options: WrapOptions): string {
  const headerColor = options.headerColor ?? '#2c7f8d'
  const badgeHtml = options.badge
    ? `<p><span class="${options.badge.class}">${escapeHtml(options.badge.text)}</span></p>`
    : ''
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .info-row { margin: 10px 0; padding: 10px; background-color: white; border-left: 3px solid ${headerColor}; }
    .label { font-weight: bold; color: #2c7f8d; }
    .success-badge { display: inline-block; padding: 5px 15px; background-color: #28a745; color: white; border-radius: 5px; font-weight: bold; }
    .error-badge { display: inline-block; padding: 5px 15px; background-color: #dc3545; color: white; border-radius: 5px; font-weight: bold; }
    .reason-box { padding: 15px; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; margin: 15px 0; }
    .code-box { font-size: 28px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: #fff; border: 2px dashed #2c7f8d; border-radius: 8px; text-align: center; margin: 20px 0; color: #2c7f8d; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header" style="background-color: ${headerColor};">
      <h1 style="margin: 0; font-size: 24px;">${escapeHtml(options.headerTitle)}</h1>
    </div>
    <div class="content">
      ${badgeHtml}
      ${body}
    </div>
    <div class="footer">
      <p>Это письмо отправлено автоматически, пожалуйста, не отвечайте на него.</p>
      <p>&copy; ${new Date().getFullYear()} ${SITE_NAME}. Все права защищены.</p>
    </div>
  </div>
</body>
</html>`
}

function infoRow(label: string, value: string): string {
  return `<div class="info-row"><span class="label">${escapeHtml(label)}:</span> ${escapeHtml(value)}</div>`
}

/** Шаблон: новый пользователь зарегистрировался */
export function getRegistrationEmail(data: { email: string; name?: string | null; lastName?: string | null }) {
  const fullName = [data.name, data.lastName].filter(Boolean).join(' ').trim() || 'Не указано'
  const title = 'Новая регистрация на сайте'
  const body = `
    <p>На сайте зарегистрирован новый пользователь:</p>
    ${infoRow('Имя', fullName)}
    ${infoRow('Email', data.email)}
    ${infoRow('Дата регистрации', new Date().toLocaleString('ru-RU'))}
  `
  return {
    subject: `[${SITE_NAME}] ${title}`,
    html: wrapHtml(body, title, { headerTitle: 'Новая регистрация', headerColor: '#2c7f8d' }),
  }
}

/** Шаблон: оплата тарифа (успешная) */
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
  const amountStr = data.amount != null ? String(data.amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽' : '—'
  const body = `
    <p>Детали платежа:</p>
    ${data.paymentId ? infoRow('ID платежа', data.paymentId) : ''}
    ${infoRow('Тариф', data.tariffName)}
    ${infoRow('Сумма', amountStr)}
    ${infoRow('Пользователь', fullName)}
    ${infoRow('Email', data.email)}
    ${infoRow('Дата оплаты', new Date().toLocaleString('ru-RU'))}
  `
  return {
    subject: `[${SITE_NAME}] ${title} — ${data.email}`,
    html: wrapHtml(body, title, {
      headerTitle: '✅ Успешная оплата',
      headerColor: '#28a745',
      badge: { text: 'ПЛАТЕЖ УСПЕШНО ОБРАБОТАН', class: 'success-badge' },
    }),
  }
}

/** Шаблон: код подтверждения регистрации (6 цифр) */
export function getVerificationCodeEmail(data: { email: string; code: string; name?: string | null }) {
  const name = data.name?.trim() || 'Пользователь'
  const title = 'Подтверждение регистрации'
  const body = `
    <p>Здравствуйте, ${escapeHtml(name)}!</p>
    <p>Ваш код подтверждения регистрации на сайте ${SITE_NAME}:</p>
    <div class="code-box">${escapeHtml(data.code)}</div>
    <p>Введите этот код на странице подтверждения. Код действителен 15 минут.</p>
    <div class="reason-box"><strong>Важно:</strong> Никому не сообщайте этот код. Если вы не регистрировались, проигнорируйте это письмо.</div>
  `
  return {
    subject: `[${SITE_NAME}] ${title} — код ${data.code}`,
    html: wrapHtml(body, title, { headerTitle: 'Подтверждение регистрации', headerColor: '#2c7f8d' }),
  }
}

/** Шаблон: код восстановления пароля (6 цифр) */
export function getPasswordResetCodeEmail(data: { email: string; code: string; name?: string | null }) {
  const name = data.name?.trim() || 'Пользователь'
  const title = 'Восстановление пароля'
  const body = `
    <p>Здравствуйте, ${escapeHtml(name)}!</p>
    <p>Ваш код для восстановления пароля на сайте ${SITE_NAME}:</p>
    <div class="code-box">${escapeHtml(data.code)}</div>
    <p>Введите этот код на странице восстановления. Код действителен 15 минут.</p>
    <div class="reason-box"><strong>Важно:</strong> Никому не сообщайте этот код. Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.</div>
  `
  return {
    subject: `[${SITE_NAME}] ${title} — код ${data.code}`,
    html: wrapHtml(body, title, { headerTitle: 'Восстановление пароля', headerColor: '#2c7f8d' }),
  }
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
  const fromName = data.userName || data.userEmail
  const messageBlock = data.message
    ? `<div class="info-row"><span class="label">Сообщение:</span><br><pre style="white-space:pre-wrap;margin:8px 0 0;font-family:inherit;">${escapeHtml(data.message)}</pre></div>`
    : ''
  const body = `
    <p>Новый запрос в поддержку:</p>
    ${data.ticketId ? infoRow('Тикет', data.ticketId) : ''}
    ${infoRow('От', fromName)}
    ${infoRow('Email', data.userEmail)}
    ${infoRow('Тема', data.subject)}
    ${messageBlock}
    ${infoRow('Дата', new Date().toLocaleString('ru-RU'))}
  `
  return {
    subject: `[${SITE_NAME}] ${title} — ${data.subject}`,
    html: wrapHtml(body, title, {
      headerTitle: 'Новый запрос в поддержку',
      headerColor: '#2c7f8d',
    }),
  }
}
