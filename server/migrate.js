import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error('DATABASE_URL_UNPOOLED must be set in .env (used for migrations, not the pooled DATABASE_URL)')
}

const sql = neon(process.env.DATABASE_URL_UNPOOLED)

await sql`
  CREATE TABLE IF NOT EXISTS students (
    id             TEXT PRIMARY KEY,
    first_name     TEXT NOT NULL,
    last_name      TEXT NOT NULL,
    student_number TEXT NOT NULL,
    active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`

await sql`
  CREATE UNIQUE INDEX IF NOT EXISTS students_student_number_lower_idx
    ON students (lower(student_number))
`

await sql`
  CREATE TABLE IF NOT EXISTS attendance (
    id               TEXT PRIMARY KEY,
    student_id       TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    attendance_date  TEXT NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, attendance_date)
  )
`

await sql`
  CREATE INDEX IF NOT EXISTS attendance_date_idx ON attendance (attendance_date)
`

await sql`
  CREATE TABLE IF NOT EXISTS daily_passwords (
    attendance_date TEXT PRIMARY KEY,
    password        TEXT NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`

await sql`
  CREATE TABLE IF NOT EXISTS classroom_location (
    id         TEXT PRIMARY KEY,
    latitude   DOUBLE PRECISION NOT NULL,
    longitude  DOUBLE PRECISION NOT NULL,
    radius_m   INTEGER NOT NULL DEFAULT 150,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`

await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS latitude        DOUBLE PRECISION`
await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS longitude       DOUBLE PRECISION`
await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS accuracy_m      DOUBLE PRECISION`
await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS distance_m      DOUBLE PRECISION`
await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location_status TEXT NOT NULL DEFAULT 'unverified'`
await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS address TEXT`

await sql`
  CREATE TABLE IF NOT EXISTS geocode_cache (
    coord_key  TEXT PRIMARY KEY,
    address    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`

console.log('Migration complete.')
