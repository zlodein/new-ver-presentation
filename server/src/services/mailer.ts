import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { getRegistrationEmail, getPaymentEmail, getSupportRequestEmail } from '../emails/templates.js'

const MAIL_TO = process.env.MAIL_TO || 'info@e-presentation.ru'
const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@e-presentation.ru'
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1'
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS

let transporter: Transporter | null = null

function getTransporter(): Transporter | null {
  if (transporter) return transporter
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })
  return transporter
}

/** Отправить письмо на info@e-presentation.ru. При отсутствии SMTP-настроек — тихо ничего не делать. */
export async function sendMail(options: { to?: string; subject: string; html: string }): Promise<void> {
  const transport = getTransporter()
  if (!transport) return
  const to = options.to || MAIL_TO
  try {
    await transport.sendMail({
      from: MAIL_FROM,
      to,
      subject: options.subject,
      html: options.html,
    })
  } catch (err) {
    console.error('[mailer] Ошибка отправки письма:', err instanceof Error ? err.message : err)
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
