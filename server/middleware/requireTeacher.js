export function requireTeacher(req, res, next) {
  if (req.session?.teacher) {
    next()
    return
  }
  res.status(401).json({ error: 'NOT_AUTHENTICATED' })
}
