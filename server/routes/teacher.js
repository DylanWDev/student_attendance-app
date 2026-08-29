import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { db, todayString } from '../db.js'
import { requireTeacher } from '../middleware/requireTeacher.js'

export const teacherRouter = Router()

teacherRouter.post('/login', (req, res) => {
  const { password } = req.body ?? {}
  if (password && password === process.env.TEACHER_PASSWORD) {
    req.session.teacher = true
    res.json({ authenticated: true })
    return
  }
  res.status(401).json({ error: 'INVALID_TEACHER_PASSWORD' })
})

teacherRouter.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ authenticated: false }))
})

teacherRouter.get('/session', (req, res) => {
  res.json({ authenticated: Boolean(req.session?.teacher) })
})

teacherRouter.use(requireTeacher)

const listStudents = db.prepare(
  'SELECT * FROM students WHERE active = 1 ORDER BY last_name, first_name'
)
const insertStudent = db.prepare(
  'INSERT INTO students (id, first_name, last_name, student_number) VALUES (?, ?, ?, ?)'
)
const updateStudent = db.prepare(`
  UPDATE students SET first_name = ?, last_name = ?, student_number = ?
  WHERE id = ? AND active = 1
`)
const getStudent = db.prepare('SELECT * FROM students WHERE id = ?')
const deactivateStudent = db.prepare('UPDATE students SET active = 0 WHERE id = ?')

function isUniqueConstraintError(err) {
  return err?.code === 'SQLITE_CONSTRAINT_UNIQUE' || err?.code === 'SQLITE_CONSTRAINT_PRIMARYKEY'
}

teacherRouter.get('/students', (req, res) => {
  res.json(listStudents.all())
})

teacherRouter.post('/students', (req, res) => {
  const { firstName, lastName, studentNumber } = req.body ?? {}
  if (!firstName?.trim() || !lastName?.trim() || !studentNumber?.trim()) {
    res.status(400).json({ error: 'MISSING_FIELDS' })
    return
  }
  try {
    const id = randomUUID()
    insertStudent.run(id, firstName.trim(), lastName.trim(), studentNumber.trim())
    res.status(201).json(getStudent.get(id))
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      res.status(409).json({ error: 'DUPLICATE_STUDENT_NUMBER' })
      return
    }
    throw err
  }
})

teacherRouter.put('/students/:id', (req, res) => {
  const { firstName, lastName, studentNumber } = req.body ?? {}
  if (!firstName?.trim() || !lastName?.trim() || !studentNumber?.trim()) {
    res.status(400).json({ error: 'MISSING_FIELDS' })
    return
  }
  try {
    const result = updateStudent.run(
      firstName.trim(),
      lastName.trim(),
      studentNumber.trim(),
      req.params.id
    )
    if (result.changes === 0) {
      res.status(404).json({ error: 'STUDENT_NOT_FOUND' })
      return
    }
    res.json(getStudent.get(req.params.id))
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      res.status(409).json({ error: 'DUPLICATE_STUDENT_NUMBER' })
      return
    }
    throw err
  }
})

teacherRouter.delete('/students/:id', (req, res) => {
  const result = deactivateStudent.run(req.params.id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'STUDENT_NOT_FOUND' })
    return
  }
  res.status(204).end()
})

const dashboardQuery = db.prepare(`
  SELECT s.id, s.first_name, s.last_name, s.student_number, a.attendance_date
  FROM students s
  LEFT JOIN attendance a
    ON a.student_id = s.id AND a.attendance_date BETWEEN ? AND ?
  WHERE s.active = 1
  ORDER BY s.last_name, s.first_name, a.attendance_date
`)

teacherRouter.get('/dashboard', (req, res) => {
  const end = req.query.end?.trim() || todayString()
  const start =
    req.query.start?.trim() ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  res.json(dashboardQuery.all(start, end))
})

const getDailyPassword = db.prepare(
  'SELECT password FROM daily_passwords WHERE attendance_date = ?'
)
const setDailyPassword = db.prepare(`
  INSERT INTO daily_passwords (attendance_date, password) VALUES (?, ?)
  ON CONFLICT (attendance_date) DO UPDATE SET password = excluded.password, updated_at = datetime('now')
`)

teacherRouter.get('/daily-password', (req, res) => {
  const row = getDailyPassword.get(todayString())
  res.json({ password: row?.password ?? null })
})

teacherRouter.post('/daily-password', (req, res) => {
  const { password } = req.body ?? {}
  if (!password?.trim()) {
    res.status(400).json({ error: 'PASSWORD_REQUIRED' })
    return
  }
  setDailyPassword.run(todayString(), password.trim())
  res.json({ password: password.trim() })
})
