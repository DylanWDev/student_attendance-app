import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { sql, todayString } from '../db.js'
import { distanceMeters } from '../lib/geo.js'
import { reverseGeocode } from '../lib/geocode.js'

export const checkinRouter = Router()

const MAX_USABLE_ACCURACY_M = 1000

checkinRouter.post('/check-in', async (req, res) => {
  const { firstName, lastName, studentNumber, password, latitude, longitude, accuracy } =
    req.body ?? {}

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

  const [classroom] = await sql`SELECT * FROM classroom_location WHERE id = 'default'`

  let locationStatus = 'unverified'
  let distance = null
  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number'

  if (classroom && hasCoords) {
    distance = distanceMeters(latitude, longitude, classroom.latitude, classroom.longitude)
    const usableAccuracy = typeof accuracy === 'number' ? accuracy : 0

    if (usableAccuracy <= MAX_USABLE_ACCURACY_M) {
      // Subtract accuracy before comparing: a device with a wide error margin gets the
      // benefit of the doubt rather than being rejected for an imprecise-but-honest fix.
      if (distance - usableAccuracy > classroom.radius_m) {
        res.status(400).json({ error: 'OUT_OF_RANGE' })
        return
      }
      locationStatus = 'verified'
    }
  }

  // Only ever resolved for a verified (confirmed in-range) check-in. An unverified row's
  // coordinates could point at a student's home, so it must never be geocoded.
  const address = locationStatus === 'verified' ? await reverseGeocode(latitude, longitude) : null

  await sql`
    INSERT INTO attendance (id, student_id, attendance_date, latitude, longitude, accuracy_m, distance_m, location_status, address)
    VALUES (${randomUUID()}, ${student.id}, ${today}, ${latitude ?? null}, ${longitude ?? null}, ${accuracy ?? null}, ${distance}, ${locationStatus}, ${address})
  `
  res.json({ firstName: student.first_name })
})
