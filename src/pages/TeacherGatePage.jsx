import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../libs/api.js'
import { friendlyError } from '../libs/errorMessages.js'
import FriendlyError from '../components/FriendlyError.jsx'

export default function TeacherGatePage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await apiPost('/teacher/login', { password })
      navigate('/teacher/dashboard', { replace: true })
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xs bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h1 className="text-xl font-bold text-slate-900 text-center">Teacher Login</h1>
        <div>
          <label htmlFor="teacherPassword" className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            id="teacherPassword"
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <FriendlyError message={error} />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 text-white font-semibold py-2.5 hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  )
}
