import crypto from 'node:crypto'
import speakeasy from 'speakeasy'

const APP_NAME = process.env.TWO_FA_APP_NAME || 'E-Presentation'
const ENC_KEY_RAW = process.env.TWO_FA_SECRET_KEY || process.env.JWT_SECRET || ''
const ENC_KEY = crypto.createHash('sha256').update(ENC_KEY_RAW).digest()

export interface TwoFactorSetupData {
  secretBase32: string
  otpauthUrl: string
}

function encrypt(value: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`
}

function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split('.')
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Invalid encrypted payload')
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()])
  return decrypted.toString('utf8')
}

export function createTwoFactorSetup(email: string): TwoFactorSetupData {
  const secret = speakeasy.generateSecret({ name: `${APP_NAME} (${email})`, issuer: APP_NAME, length: 32 })
  if (!secret.base32 || !secret.otpauth_url) throw new Error('Unable to generate 2FA secret')
  return { secretBase32: secret.base32, otpauthUrl: secret.otpauth_url }
}

export function verifyTotp(secretBase32: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret: secretBase32,
    encoding: 'base32',
    token: String(token).trim().replace(/\s+/g, ''),
    window: 1,
  })
}

export function encryptTwoFactorSecret(secretBase32: string): string {
  return encrypt(secretBase32)
}

export function decryptTwoFactorSecret(encrypted: string): string {
  return decrypt(encrypted)
}

export function generateBackupCodes(count = 8): string[] {
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    result.push(crypto.randomBytes(4).toString('hex').toUpperCase())
  }
  return result
}

export async function hashBackupCodes(codes: string[]): Promise<string> {
  const hashes = await Promise.all(
    codes.map(async (code) => {
      const hash = crypto.createHash('sha256').update(code).digest('hex')
      return hash
    })
  )
  return JSON.stringify(hashes)
}

export function verifyBackupCode(code: string, hashJson: string | null | undefined): { ok: boolean; remainingHashes: string[] } {
  if (!hashJson) return { ok: false, remainingHashes: [] }
  let hashes: string[] = []
  try {
    hashes = JSON.parse(hashJson) as string[]
  } catch {
    hashes = []
  }
  const normalized = String(code).trim().toUpperCase()
  const hash = crypto.createHash('sha256').update(normalized).digest('hex')
  const idx = hashes.findIndex((h) => h === hash)
  if (idx < 0) return { ok: false, remainingHashes: hashes }
  const remainingHashes = hashes.filter((_, i) => i !== idx)
  return { ok: true, remainingHashes }
}
