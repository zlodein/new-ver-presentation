import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { getRegistrationEmail, getPaymentEmail, getSupportRequestEmail } from '../emails/templates.js'

/** Опции SMTP для createTransport (типы nodemailer различаются по версиям) */
interface SmtpConnectionOptions {
  host: string
  port: number
  secure: boolean
  auth: { user: string; pass: string }
  requireTLS?: boolean
  tls?: { rejectUnauthorized: boolean }
}

const MAIL_TO = process.env.MAIL_TO || 'info@e-presentation.ru'
const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@e-presentation.ru'
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1'
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
/** Для серверов с самоподписанным сертификатом (например свой SMTP на e-presentation.ru) задайте SMTP_INSECURE_TLS=1 */
const SMTP_INSECURE_TLS = process.env.SMTP_INSECURE_TLS === '1' || process.env.SMTP_INSECURE_TLS === 'true'

let transporter: Transporter | null = null
let skipLogShown = false

function getTransporter(): Transporter | null {
  if (transporter) return transporter
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null
  }
  const options: SmtpConnectionOptions = {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  }
  if (SMTP_PORT === 587 && !SMTP_SECURE) {
    options.requireTLS = true
  }
  if (SMTP_INSECURE_TLS) {
    options.tls = { rejectUnauthorized: false }
  }
  transporter = nodemailer.createTransport(options)
  return transporter
}

/** Проверка: настроена ли отправка писем (для логов и диагностики). */
export function isMailConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS)
}

/** Отправить письмо на info@e-presentation.ru. При отсутствии SMTP — не отправляет и пишет в лог один раз. */
export async function sendMail(options: { to?: string; subject: string; html: string }): Promise<void> {
  const transport = getTransporter()
  if (!transport) {
    if (!skipLogShown) {
      skipLogShown = true
      console.warn(
        '[mailer] Письма не отправляются: в .env не заданы SMTP_HOST, SMTP_USER и SMTP_PASS. ' +
          'Добавьте их в server/.env для уведомлений на ' +
          MAIL_TO
      )
    }
    return
  }
  const to = options.to || MAIL_TO
  try {
    await transport.sendMail({
      from: MAIL_FROM,
      to,
      subject: options.subject,
      html: options.html,
    })
    console.log('[mailer] Письмо отправлено:', options.subject, '→', to)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : ''
    console.error('[mailer] Ошибка отправки письма:', msg)
    if (stack) console.error('[mailer]', stack)
  }
}

/** Уведомление о новой регистрации */
export async function sendRegistrationNotification(data: {
  email: string
  name?: string | null
  lastName?: string | null
}): Promise<void> {
  const { subject, html } = getRegistrationEmail(data)
  await sendMail({ subject, html })
}

/** Уведомление об оплате тарифа (вызвать при успешной оплате, например из webhook) */
export async function sendPaymentNotification(data: {
  email: string
  name?: string | null
  lastName?: string | null
  tariffName: string
  amount?: string | number
  paymentId?: string
}): Promise<void> {
  const { subject, html } = getPaymentEmail(data)
  await sendMail({ subject, html })
}

/** Уведомление о новом запросе в поддержку */
export async function sendSupportRequestNotification(data: {
  userEmail: string
  userName?: string | null
  subject: string
  message?: string | null
  ticketId?: string
}): Promise<void> {
  const { subject, html } = getSupportRequestEmail(data)
  await sendMail({ subject, html })
}

if (isMailConfigured()) {
  console.log('[mailer] Уведомления на почту включены, MAIL_TO=' + MAIL_TO)
} else {
  console.log('[mailer] Уведомления на почту отключены. Задайте SMTP_HOST, SMTP_USER, SMTP_PASS в server/.env')
}
