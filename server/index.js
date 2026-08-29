import 'dotenv/config'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import session from 'express-session'
import { checkinRouter } from './routes/checkin.js'
import { teacherRouter } from './routes/teacher.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'

if (!process.env.TEACHER_PASSWORD || !process.env.SESSION_SECRET) {
  throw new Error('TEACHER_PASSWORD and SESSION_SECRET must be set in .env')
}

const app = express()
app.use(express.json())
app.use(
  session({
    name: 'attendance.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 12, // 12 hours
    },
  })
)

app.use('/api', checkinRouter)
app.use('/api/teacher', teacherRouter)

if (isProduction) {
  const distDir = join(__dirname, '..', 'dist')
  app.use(express.static(distDir))
  app.get(/.*/, (req, res) => res.sendFile(join(distDir, 'index.html')))
}

// eslint-disable-next-line no-unused-vars -- Express requires 4 args to recognize an error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'SERVER_ERROR' })
})

const port = process.env.API_PORT || 3001
app.listen(port, () => console.log(`Attendance server listening on port ${port}`))
