import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiGet } from '../libs/api.js'
import ContributionCalendar from '../components/ContributionCalendar.jsx'
import FriendlyError from '../components/FriendlyError.jsx'

export default function StudentCalendarPage() {
  const { id } = useParams()
  // Tagged with the id it belongs to, so switching students falls back to the loading
  // state rather than briefly showing the previous student's history.
  const [result, setResult] = useState(null)

  useEffect(() => {
    let cancelled = false
    apiGet(`/teacher/students/${id}/attendance`)
      .then((data) => {
        if (!cancelled) setResult({ id, data })
      })
      .catch((err) => {
        if (cancelled) return
        setResult({
          id,
          error:
            err.code === 'STUDENT_NOT_FOUND'
              ? 'That student is not on the roster.'
              : 'Could not load attendance history.',
        })
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const current = result?.id === id ? result : null

  if (current?.error) return <FriendlyError message={current.error} />
  if (!current) return <p className="text-slate-500 text-sm">Loading…</p>

  const { student, dates } = current.data

  return (
    <div className="space-y-4">
      <Link to="/teacher/dashboard" className="text-sm text-indigo-600 hover:text-indigo-800">
        ← Back to dashboard
      </Link>

      <div>
        <h2 className="text-lg font-semibold text-slate-800">
          {student.first_name} {student.last_name}
          <span className="text-sm font-normal text-slate-500 ml-2">
            ID: {student.student_number}
          </span>
        </h2>
        <p className="text-sm text-slate-500">
          {dates.length} {dates.length === 1 ? 'day' : 'days'} present
          {dates.length > 0 && ` since ${dates[0]}`}
        </p>
      </div>

      {dates.length === 0 ? (
        <p className="text-sm text-slate-400">No attendance recorded yet.</p>
      ) : (
        <ContributionCalendar dates={dates} />
      )}
    </div>
  )
}
