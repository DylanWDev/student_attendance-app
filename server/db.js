import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, 'data')
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })

export const db = new Database(join(dataDir, 'attendance.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id             TEXT PRIMARY KEY,
    first_name     TEXT NOT NULL,
    last_name      TEXT NOT NULL,
    student_number TEXT NOT NULL,
    active         INTEGER NOT NULL DEFAULT 1,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS students_student_number_lower_idx ON students (lower(student_number));

  CREATE TABLE IF NOT EXISTS attendance (
    id               TEXT PRIMARY KEY,
    student_id       TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    attendance_date  TEXT NOT NULL,
    created_at       TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (student_id, attendance_date)
  );
  CREATE INDEX IF NOT EXISTS attendance_date_idx ON attendance (attendance_date);

  CREATE TABLE IF NOT EXISTS daily_passwords (
    attendance_date TEXT PRIMARY KEY,
    password        TEXT NOT NULL,
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

export function todayString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
