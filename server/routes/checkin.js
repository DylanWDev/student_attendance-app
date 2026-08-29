import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { sql, todayString } from '../db.js'

export const checkinRouter = Router()

checkinRouter.post('/check-in', async (req, res) => {
  const { firstName, lastName, studentNumber, password } = req.body ?? {}

  if (!firstName?.trim() || !lastName?.trim() || !studentNumber?.trim() || !password?.trim()) {
    res.status(400).json({ error: 'MISSING_FIELDS' })
    return
  }

  const today = todayString()

  const [passwordRow] = await sql`
    SELECT password FROM daily_passwords WHERE attendance_date = ${today}
  `
  if (!passwordRow || passwordRow.password !== password.trim()) {
    res.status(400).json({ error: 'INVALID_PASSWORD' })
    return
  }

  const [student] = await sql`
    SELECT * FROM students
    WHERE active
      AND lower(trim(first_name)) = lower(trim(${firstName}))
      AND lower(trim(last_name)) = lower(trim(${lastName}))
      AND lower(trim(student_number)) = lower(trim(${studentNumber}))
  `
  if (!student) {
    res.status(400).json({ error: 'ROSTER_MISMATCH' })
    return
  }

  const [existing] = await sql`
    SELECT 1 FROM attendance WHERE student_id = ${student.id} AND attendance_date = ${today}
  `
  if (existing) {
    res.status(409).json({ error: 'ALREADY_CHECKED_IN' })
    return
  }

  await sql`
    INSERT INTO attendance (id, student_id, attendance_date) VALUES (${randomUUID()}, ${student.id}, ${today})
  `
  res.json({ firstName: student.first_name })
})
