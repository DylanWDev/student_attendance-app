import { COOKIE_NAME, verifyTeacherCookie } from '../lib/authCookie.js'

export function requireTeacher(req, res, next) {
  if (verifyTeacherCookie(req.cookies?.[COOKIE_NAME])) {
    next()
    return
  }
  res.status(401).json({ error: 'NOT_AUTHENTICATED' })
}
