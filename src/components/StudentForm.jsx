import { useState } from 'react'
import FriendlyError from './FriendlyError.jsx'
import { friendlyError } from '../libs/errorMessages.js'

const emptyForm = { firstName: '', lastName: '', studentNumber: '' }

export default function StudentForm({ initialValue, onSubmit, onCancel, submitLabel = 'Add student' }) {
  const [form, setForm] = useState(initialValue ?? emptyForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await onSubmit(form)
      if (!initialValue) setForm(emptyForm)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">First name</label>
        <input
          required
          value={form.firstName}
          onChange={updateField('firstName')}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm w-32"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Last name</label>
        <input
          required
          value={form.lastName}
          onChange={updateField('lastName')}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm w-32"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Student ID</label>
        <input
          required
          value={form.studentNumber}
          onChange={updateField('studentNumber')}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm w-28"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-1.5 hover:bg-indigo-700 disabled:opacity-60"
      >
        {submitting ? 'Saving…' : submitLabel}
      </button>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-slate-500 px-2 py-1.5 hover:text-slate-700"
        >
          Cancel
        </button>
      )}
      <div className="basis-full">
        <FriendlyError message={error} />
      </div>
    </form>
  )
}
