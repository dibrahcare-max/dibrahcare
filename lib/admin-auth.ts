import crypto from 'crypto'

// نستخدم PBKDF2 (متاح في Node.js بدون مكتبات إضافية)
// 100,000 iterations + salt = حماية قوية ضد brute force

const ITERATIONS = 100_000
const KEY_LENGTH = 64
const DIGEST = 'sha512'

/**
 * تشفير كلمة المرور
 * يرجع نص بصيغة: <salt>:<hash>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex')
  return `${salt}:${hash}`
}

/**
 * التحقق من كلمة المرور
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':')
    if (!salt || !hash) return false

    const candidateHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex')

    // مقارنة آمنة من timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(candidateHash, 'hex'),
      Buffer.from(hash, 'hex')
    )
  } catch {
    return false
  }
}

/**
 * إنشاء توكن جلسة للأدمن (3 أيام)
 */
export function createAdminSessionToken(payload: { id: string; username: string; name: string }): string {
  const secret = process.env.SESSION_SECRET || 'dibrah-default-secret-change-me'
  const data = JSON.stringify({
    ...payload,
    role: 'admin',
    exp: Date.now() + 3 * 24 * 60 * 60 * 1000,
  })
  const encoded = Buffer.from(data).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

/**
 * التحقق من توكن جلسة الأدمن
 */
export function verifyAdminSessionToken(token: string): { id: string; username: string; name: string } | null {
  try {
    const secret = process.env.SESSION_SECRET || 'dibrah-default-secret-change-me'
    const [encoded, signature] = token.split('.')
    if (!encoded || !signature) return null

    const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url')
    if (expected !== signature) return null

    const data = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    if (data.exp < Date.now()) return null
    if (data.role !== 'admin') return null

    return { id: data.id, username: data.username, name: data.name }
  } catch {
    return null
  }
}
