import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiDelete, apiGet, apiPut } from '../libs/api.js'
import { friendlyError } from '../libs/errorMessages.js'
import ContributionCalendar from '../components/ContributionCalendar.jsx'
import FriendlyError from '../components/FriendlyError.jsx'

function localDateString(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function localTimeString(d = new Date()) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function StudentCalendarPage() {
  const { id } = useParams()
  // Tagged with the id it belongs to, so switching students falls back to the loading
  // state rather than briefly showing the previous student's history.
  const [result, setResult] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [date, setDate] = useState(() => localDateString())
  const [time, setTime] = useState(() => localTimeString())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

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
  }, [id, reloadKey])

  async function save(action) {
    setSaving(true)
    setFormError(null)
    try {
      await action()
      setReloadKey((k) => k + 1)
    } catch (err) {
      setFormError(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  const markPresent = () =>
    save(() => apiPut(`/teacher/students/${id}/attendance/${date}`, { time: time || null }))
  const markAbsent = () => save(() => apiDelete(`/teacher/students/${id}/attendance/${date}`))

  const current = result?.id === id ? result : null

  if (current?.error) return <FriendlyError message={current.error} />
  if (!current) return <p className="text-slate-500 text-sm">Loading…</p>

  const { student, days } = current.data

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
          {days.length} {days.length === 1 ? 'day' : 'days'} present
          {days.length > 0 && ` since ${days[0].date}`}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Set attendance manually</h3>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-slate-500">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block mt-1 border border-slate-300 rounded px-2 py-1 text-sm text-slate-800"
            />
          </label>
          <label className="text-xs text-slate-500">
            Time
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="block mt-1 border border-slate-300 rounded px-2 py-1 text-sm text-slate-800"
            />
          </label>
          <button
            onClick={markPresent}
            disabled={saving || !date}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded px-3 py-1.5"
          >
            Mark present
          </button>
          <button
            onClick={markAbsent}
            disabled={saving || !date}
            className="bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 text-sm rounded px-3 py-1.5"
          >
            Mark absent
          </button>
        </div>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
      </div>

      {days.length === 0 ? (
        <p className="text-sm text-slate-400">No attendance recorded yet.</p>
      ) : (
        <ContributionCalendar days={days} />
      )}
    </div>
  )
}
