import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../libs/api.js'
import { friendlyError } from '../libs/errorMessages.js'
import FriendlyError from '../components/FriendlyError.jsx'

export default function DailyPasswordPage() {
  const [current, setCurrent] = useState(undefined) // undefined = loading, null = unset
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    apiGet('/teacher/daily-password')
      .then((res) => setCurrent(res.password))
      .catch(() => setError('Could not load today’s password.'))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setSubmitting(true)
    try {
      const res = await apiPost('/teacher/daily-password', { password: input })
      setCurrent(res.password)
      setInput('')
      setSaved(true)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-sm space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Today&apos;s password</h2>
        {current === undefined ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : current ? (
          <p className="text-2xl font-bold tracking-wide text-indigo-700">{current}</p>
        ) : (
          <p className="text-sm text-slate-400">Not set yet today.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">
          {current ? 'Change it' : 'Set it'}
        </label>
        <input
          id="newPassword"
          required
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <FriendlyError message={error} />
        {saved && <p className="text-sm text-green-600">Saved!</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 text-white font-semibold py-2.5 hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}
