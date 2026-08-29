import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { db, todayString } from '../db.js'

export const checkinRouter = Router()

const getTodayPassword = db.prepare(
  'SELECT password FROM daily_passwords WHERE attendance_date = ?'
)
const findStudent = db.prepare(`
  SELECT * FROM students
  WHERE active = 1
    AND lower(trim(first_name)) = lower(trim(?))
    AND lower(trim(last_name)) = lower(trim(?))
    AND lower(trim(student_number)) = lower(trim(?))
`)
const findAttendance = db.prepare(
  'SELECT 1 FROM attendance WHERE student_id = ? AND attendance_date = ?'
)
const insertAttendance = db.prepare(
  'INSERT INTO attendance (id, student_id, attendance_date) VALUES (?, ?, ?)'
)

checkinRouter.post('/check-in', (req, res) => {
  const { firstName, lastName, studentNumber, password } = req.body ?? {}

  if (!firstName?.trim() || !lastName?.trim() || !studentNumber?.trim() || !password?.trim()) {
    res.status(400).json({ error: 'MISSING_FIELDS' })
    return
  }

  const today = todayString()

  const row = getTodayPassword.get(today)
  if (!row || row.password !== password.trim()) {
    res.status(400).json({ error: 'INVALID_PASSWORD' })
    return
  }

  const student = findStudent.get(firstName, lastName, studentNumber)
  if (!student) {
    res.status(400).json({ error: 'ROSTER_MISMATCH' })
    return
  }

  if (findAttendance.get(student.id, today)) {
    res.status(409).json({ error: 'ALREADY_CHECKED_IN' })
    return
  }

  insertAttendance.run(randomUUID(), student.id, today)
  res.json({ firstName: student.first_name })
})
