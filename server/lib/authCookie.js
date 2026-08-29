import { createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE_NAME = 'attendance_teacher'
const MAX_AGE_MS = 1000 * 60 * 60 * 12 // 12 hours

function sign(expiresAtMs) {
  return createHmac('sha256', process.env.SESSION_SECRET)
    .update(`${expiresAtMs}:teacher`)
    .digest('hex')
}

export function signTeacherCookie() {
  const expiresAtMs = Date.now() + MAX_AGE_MS
  return `${expiresAtMs}.${sign(expiresAtMs)}`
}

export function verifyTeacherCookie(value) {
  if (!value) return false

  const [expiresAtMs, hmac] = value.split('.')
  if (!expiresAtMs || !hmac) return false
  if (Date.now() > Number(expiresAtMs)) return false

  const expected = sign(expiresAtMs)
  const a = Buffer.from(hmac)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export { COOKIE_NAME, MAX_AGE_MS }
