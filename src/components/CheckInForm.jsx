import { useState } from 'react'
import { apiPost } from '../libs/api.js'
import { friendlyError } from '../libs/errorMessages.js'
import FriendlyError from './FriendlyError.jsx'

const emptyForm = { firstName: '', lastName: '', studentNumber: '', password: '' }

export default function CheckInForm() {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [welcomeName, setWelcomeName] = useState('')

  function updateField(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const result = await apiPost('/check-in', form)
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
        {submitting ? 'Checking in…' : "I'm here!"}
      </button>
    </form>
  )
}
