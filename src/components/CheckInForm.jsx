import { useState } from 'react'
import { apiPost } from '../libs/api.js'
import { friendlyError } from '../libs/errorMessages.js'
import FriendlyError from './FriendlyError.jsx'

const emptyForm = { firstName: '', lastName: '', studentNumber: '', password: '' }

// Resolves to null on every failure — permission denied, timeout, or geolocation being
// unavailable on an insecure origin. A location problem must never block the check-in.
function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  })
}

export default function CheckInForm() {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [locating, setLocating] = useState(false)
  const [welcomeName, setWelcomeName] = useState('')

  function updateField(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    setLocating(true)
    const location = await getLocation()
    setLocating(false)
    try {
      const result = await apiPost('/check-in', { ...form, ...location })
      setWelcomeName(result.firstName)
      setForm(emptyForm)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (welcomeName) {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-6 text-center">
        <p className="text-lg font-semibold">You&apos;re all set, {welcomeName}!</p>
        <p className="text-sm mt-1">You&apos;ve been marked present today.</p>
        <button
          type="button"
          onClick={() => setWelcomeName('')}
          className="mt-4 text-sm underline text-green-700"
        >
          Check in someone else
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">
            First name
          </label>
          <input
            id="firstName"
            required
            autoComplete="given-name"
            value={form.firstName}
            onChange={updateField('firstName')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">
            Last name
          </label>
          <input
            id="lastName"
            required
            autoComplete="family-name"
            value={form.lastName}
            onChange={updateField('lastName')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="studentNumber" className="block text-sm font-medium text-slate-700 mb-1">
          Student ID
        </label>
        <input
          id="studentNumber"
          required
          value={form.studentNumber}
          onChange={updateField('studentNumber')}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
          Today&apos;s password
        </label>
        <input
          id="password"
          required
          type="text"
          value={form.password}
          onChange={updateField('password')}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <FriendlyError message={error} />

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-indigo-600 text-white font-semibold py-3 text-base hover:bg-indigo-700 disabled:opacity-60"
      >
        {locating ? 'Finding your location…' : submitting ? 'Checking in…' : "I'm here!"}
      </button>
    </form>
  )
}
