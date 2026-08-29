import express from 'express'
import cookieParser from 'cookie-parser'
import { checkinRouter } from './routes/checkin.js'
import { teacherRouter } from './routes/teacher.js'

if (!process.env.TEACHER_PASSWORD || !process.env.SESSION_SECRET || !process.env.DATABASE_URL) {
  throw new Error('TEACHER_PASSWORD, SESSION_SECRET, and DATABASE_URL must be set in .env')
}

export const app = express()
app.use(express.json())
app.use(cookieParser())

app.use('/api', checkinRouter)
app.use('/api/teacher', teacherRouter)

// eslint-disable-next-line no-unused-vars -- Express requires 4 args to recognize an error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'SERVER_ERROR' })
})
