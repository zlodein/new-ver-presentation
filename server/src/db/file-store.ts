import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const STORE_PATH = process.env.STORE_PATH || join(__dirname, '..', '..', 'data', 'store.json')

interface User {
  id: string
  email: string
  passwordHash: string
  firstName: string | null
  lastName: string | null
  emailVerified?: string
  createdAt: string
  updatedAt: string
}

interface VerificationCode {
  id: string
  email: string
  code: string
  type: string
  userId?: string
  expiresAt: string
  createdAt: string
}

interface Presentation {
  id: string
  userId: string
  title: string
  coverImage: string | null
  content: string
  createdAt: string
  updatedAt: string
}

interface PasswordResetToken {
  id: string
  userId: string
  token: string
  expiresAt: string
  createdAt: string
}

interface StoreData {
  users: User[]
  presentations: Presentation[]
  passwordResetTokens: PasswordResetToken[]
  verificationCodes: VerificationCode[]
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function load(): StoreData {
  if (!existsSync(STORE_PATH)) {
    return { users: [], presentations: [], passwordResetTokens: [], verificationCodes: [] }
  }
  const raw = readFileSync(STORE_PATH, 'utf-8')
  try {
    const d = JSON.parse(raw) as StoreData
    if (!Array.isArray(d.verificationCodes)) d.verificationCodes = []
    return d
  } catch {
    return { users: [], presentations: [], passwordResetTokens: [], verificationCodes: [] }
  }
}

function save(data: StoreData): void {
  mkdirSync(dirname(STORE_PATH), { recursive: true })
  writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export const fileStore = {
  load(): StoreData {
    return load()
  },
  findUserByEmail(email: string): User | undefined {
    return load().users.find((u) => u.email === email.toLowerCase())
  },
  findUserById(id: string): User | undefined {
    return load().users.find((u) => u.id === id)
  },
  createUser(data: { email: string; passwordHash: string; firstName?: string | null; lastName?: string | null; emailVerified?: string }): User {
    const d = load()
    const user: User = {
      id: uuid(),
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      emailVerified: data.emailVerified ?? 'false',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    d.users.push(user)
    save(d)
    return user
  },
  updateUser(id: string, data: Partial<Pick<User, 'passwordHash' | 'firstName' | 'lastName' | 'emailVerified' | 'updatedAt'>>): void {
    const d = load()
    const u = d.users.find((x) => x.id === id)
    if (u) {
      if (data.passwordHash != null) u.passwordHash = data.passwordHash
      if (data.firstName != null) u.firstName = data.firstName
      if (data.lastName != null) u.lastName = data.lastName
      if (data.emailVerified != null) u.emailVerified = data.emailVerified
      u.updatedAt = (data.updatedAt as string) ?? new Date().toISOString()
      save(d)
    }
  },
  createVerificationCode(data: { email: string; code: string; type: string; userId?: string; expiresAt: Date }): void {
    const d = load()
    d.verificationCodes.push({
      id: uuid(),
      email: data.email.toLowerCase(),
      code: data.code,
      type: data.type,
      userId: data.userId,
      expiresAt: data.expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    })
    save(d)
  },
  findValidVerificationCode(email: string, code: string, type: string): VerificationCode | undefined {
    const now = new Date().toISOString()
    return load().verificationCodes.find(
      (v) => v.email === email.toLowerCase() && v.code === code && v.type === type && v.expiresAt > now
    )
  },
  deleteVerificationCode(id: string): void {
    const d = load()
    d.verificationCodes = d.verificationCodes.filter((v) => v.id !== id)
    save(d)
  },
  getPresentationsByUserId(userId: string): Presentation[] {
    return load().presentations.filter((p) => p.userId === userId).sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
  },
  getPresentationById(id: string, userId: string): Presentation | undefined {
    const p = load().presentations.find((x) => x.id === id && x.userId === userId)
    return p
  },
  createPresentation(data: { userId: string; title: string; coverImage?: string | null; content: string }): Presentation {
    const d = load()
    const now = new Date().toISOString()
    const pres: Presentation = {
      id: uuid(),
      userId: data.userId,
      title: data.title,
      coverImage: data.coverImage ?? null,
      content: data.content,
      createdAt: now,
      updatedAt: now,
    }
    d.presentations.push(pres)
    save(d)
    return pres
  },
  updatePresentation(id: string, userId: string, data: Partial<Pick<Presentation, 'title' | 'coverImage' | 'content' | 'updatedAt'>>): Presentation | null {
    const d = load()
    const p = d.presentations.find((x) => x.id === id && x.userId === userId)
    if (!p) return null
    if (data.title != null) p.title = data.title
    if (data.coverImage !== undefined) p.coverImage = data.coverImage
    if (data.content != null) p.content = data.content
    p.updatedAt = (data.updatedAt as string) ?? new Date().toISOString()
    save(d)
    return p
  },
  deletePresentation(id: string, userId: string): boolean {
    const d = load()
    const idx = d.presentations.findIndex((x) => x.id === id && x.userId === userId)
    if (idx === -1) return false
    d.presentations.splice(idx, 1)
    save(d)
    return true
  },
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): void {
    const d = load()
    d.passwordResetTokens.push({
      id: uuid(),
      userId,
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    })
    save(d)
  },
  findValidResetToken(token: string): { id: string; userId: string } | undefined {
    const now = new Date().toISOString()
    return load().passwordResetTokens.find((t) => t.token === token && t.expiresAt > now)
  },
  deleteResetToken(id: string): void {
    const d = load()
    d.passwordResetTokens = d.passwordResetTokens.filter((t) => t.id !== id)
    save(d)
  },
}
