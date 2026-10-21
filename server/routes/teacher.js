import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { sql, todayString } from '../db.js'
import { requireTeacher } from '../middleware/requireTeacher.js'
import { COOKIE_NAME, MAX_AGE_MS, signTeacherCookie, verifyTeacherCookie } from '../lib/authCookie.js'

export const teacherRouter = Router()

const cookieOptions = {
  httpOnly: true,
  secure: process.env.VERCEL === '1',
  sameSite: 'lax',
  maxAge: MAX_AGE_MS,
}

teacherRouter.post('/login', (req, res) => {
  const { password } = req.body ?? {}
  if (password && password === process.env.TEACHER_PASSWORD) {
    res.cookie(COOKIE_NAME, signTeacherCookie(), cookieOptions)
    res.json({ authenticated: true })
    return
  }
  res.status(401).json({ error: 'INVALID_TEACHER_PASSWORD' })
})

teacherRouter.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions)
  res.json({ authenticated: false })
})

teacherRouter.get('/session', (req, res) => {
  res.json({ authenticated: verifyTeacherCookie(req.cookies?.[COOKIE_NAME]) })
})

teacherRouter.use(requireTeacher)

function isUniqueConstraintError(err) {
  return err?.code === '23505'
}

teacherRouter.get('/students', async (req, res) => {
  const students = await sql`
    SELECT * FROM students WHERE active ORDER BY last_name, first_name
  `
  res.json(students)
})

teacherRouter.post('/students', async (req, res) => {
  const { firstName, lastName, studentNumber } = req.body ?? {}
  if (!firstName?.trim() || !lastName?.trim() || !studentNumber?.trim()) {
    res.status(400).json({ error: 'MISSING_FIELDS' })
    return
  }
  try {
    const [student] = await sql`
      INSERT INTO students (id, first_name, last_name, student_number)
      VALUES (${randomUUID()}, ${firstName.trim()}, ${lastName.trim()}, ${studentNumber.trim()})
      RETURNING *
    `
    res.status(201).json(student)
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      res.status(409).json({ error: 'DUPLICATE_STUDENT_NUMBER' })
      return
    }
    throw err
  }
})

teacherRouter.put('/students/:id', async (req, res) => {
  const { firstName, lastName, studentNumber } = req.body ?? {}
  if (!firstName?.trim() || !lastName?.trim() || !studentNumber?.trim()) {
    res.status(400).json({ error: 'MISSING_FIELDS' })
    return
  }
  try {
    const [student] = await sql`
      UPDATE students SET first_name = ${firstName.trim()}, last_name = ${lastName.trim()}, student_number = ${studentNumber.trim()}
      WHERE id = ${req.params.id} AND active
      RETURNING *
    `
    if (!student) {
      res.status(404).json({ error: 'STUDENT_NOT_FOUND' })
      return
    }
    res.json(student)
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      res.status(409).json({ error: 'DUPLICATE_STUDENT_NUMBER' })
      return
    }
    throw err
  }
})

teacherRouter.delete('/students/:id', async (req, res) => {
  const [student] = await sql`
    UPDATE students SET active = false WHERE id = ${req.params.id} RETURNING id
  `
  if (!student) {
    res.status(404).json({ error: 'STUDENT_NOT_FOUND' })
    return
  }
  res.status(204).end()
})

// Deliberately not filtered on `active`: removing a student is a soft delete and their
// history is kept, so a link to a removed student should still open their calendar.
teacherRouter.get('/students/:id/attendance', async (req, res) => {
  const [student] = await sql`
    SELECT * FROM students WHERE id = ${req.params.id}
  `
  if (!student) {
    res.status(404).json({ error: 'STUDENT_NOT_FOUND' })
    return
  }

  const rows = await sql`
    SELECT attendance_date, created_at FROM attendance
    WHERE student_id = ${student.id}
    ORDER BY attendance_date
  `
  res.json({
    student,
    days: rows.map((row) => ({ date: row.attendance_date, checkedInAt: row.created_at })),
  })
})

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

// Teacher override: mark a student present on any date, optionally at a specific moment
// (`at`, an ISO timestamp built by the browser so the teacher's time zone is respected).
// The moment is stored in created_at, which is also what a self check-in records.
// Idempotent — marking an already-present day only changes its time when `at` is given.
teacherRouter.put('/students/:id/attendance/:date', async (req, res) => {
  const { date } = req.params
  const at = req.body?.at ? new Date(req.body.at) : null
  if (!isValidDate(date) || (at && Number.isNaN(at.getTime()))) {
    res.status(400).json({ error: 'INVALID_DATE_OR_TIME' })
    return
  }

  const [student] = await sql`SELECT id FROM students WHERE id = ${req.params.id}`
  if (!student) {
    res.status(404).json({ error: 'STUDENT_NOT_FOUND' })
    return
  }

  const [row] = await sql`
    INSERT INTO attendance (id, student_id, attendance_date, created_at)
    VALUES (${randomUUID()}, ${student.id}, ${date}, COALESCE(${at?.toISOString() ?? null}::timestamptz, now()))
    ON CONFLICT (student_id, attendance_date) DO UPDATE SET created_at = COALESCE(${at?.toISOString() ?? null}::timestamptz, attendance.created_at)
    RETURNING created_at
  `
  res.json({ date, checkedInAt: row.created_at })
})

// Teacher override: mark a student absent on a date by removing that day's record.
teacherRouter.delete('/students/:id/attendance/:date', async (req, res) => {
  if (!isValidDate(req.params.date)) {
    res.status(400).json({ error: 'INVALID_DATE_OR_TIME' })
    return
  }
  await sql`
    DELETE FROM attendance WHERE student_id = ${req.params.id} AND attendance_date = ${req.params.date}
  `
  res.status(204).end()
})

teacherRouter.get('/dashboard', async (req, res) => {
  const end = req.query.end?.trim() || todayString()
  const start =
    req.query.start?.trim() ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const rows = await sql`
    SELECT s.id, s.first_name, s.last_name, s.student_number, a.attendance_date
    FROM students s
    LEFT JOIN attendance a
      ON a.student_id = s.id AND a.attendance_date BETWEEN ${start} AND ${end}
    WHERE s.active
    ORDER BY s.last_name, s.first_name, a.attendance_date
  `
  res.json(rows)
})

teacherRouter.get('/daily-password', async (req, res) => {
  const [row] = await sql`
    SELECT password FROM daily_passwords WHERE attendance_date = ${todayString()}
  `
  res.json({ password: row?.password ?? null })
})

teacherRouter.post('/daily-password', async (req, res) => {
  const { password } = req.body ?? {}
  if (!password?.trim()) {
    res.status(400).json({ error: 'PASSWORD_REQUIRED' })
    return
  }
  await sql`
    INSERT INTO daily_passwords (attendance_date, password) VALUES (${todayString()}, ${password.trim()})
    ON CONFLICT (attendance_date) DO UPDATE SET password = excluded.password, updated_at = now()
  `
  res.json({ password: password.trim() })
})
