import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiDelete, apiGet, apiPost, apiPut } from '../libs/api.js'
import StudentForm from '../components/StudentForm.jsx'
import FriendlyError from '../components/FriendlyError.jsx'

function toFormShape(student) {
  return {
    firstName: student.first_name,
    lastName: student.last_name,
    studentNumber: student.student_number,
  }
}

// Every whitespace-separated term has to appear somewhere in the name or ID, so "smith
// john" matches as readily as "john smith", and "john 204" narrows by name and ID at once.
function matchesQuery(student, terms) {
  const haystack =
    `${student.first_name} ${student.last_name} ${student.student_number}`.toLowerCase()
  return terms.every((term) => haystack.includes(term))
}

export default function RosterPage() {
  const [students, setStudents] = useState(null)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [query, setQuery] = useState('')

  function loadStudents() {
    apiGet('/teacher/students')
      .then(setStudents)
      .catch(() => setError('Could not load the roster.'))
  }

  useEffect(loadStudents, [])

  async function handleAdd(form) {
    await apiPost('/teacher/students', form)
    // Drop any active filter: the student just added almost certainly does not match it,
    // and a roster that looks unchanged reads as the add having failed.
    setQuery('')
    loadStudents()
  }

  async function handleUpdate(id, form) {
    await apiPut(`/teacher/students/${id}`, form)
    setEditingId(null)
    loadStudents()
  }

  async function handleDelete(id) {
    if (!confirm('Remove this student from the roster? Their attendance history is kept.')) return
    await apiDelete(`/teacher/students/${id}`)
    loadStudents()
  }

  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const visible = students?.filter((s) => matchesQuery(s, terms)) ?? []

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Add a student</h2>
        <StudentForm onSubmit={handleAdd} />
      </div>

      {error && <FriendlyError message={error} />}

      {students && students.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or student ID"
              aria-label="Search the roster"
              className="w-full rounded-lg border border-slate-300 pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {terms.length > 0
              ? `${visible.length} of ${students.length}`
              : `${students.length} ${students.length === 1 ? 'student' : 'students'}`}
          </span>
        </div>
      )}

      {!students ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : students.length === 0 ? (
        <p className="text-slate-500 text-sm">No students yet — add your first one above.</p>
      ) : visible.length === 0 ? (
        <p className="text-slate-500 text-sm">No students match “{query.trim()}”.</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {visible.map((s) =>
            editingId === s.id ? (
              <div key={s.id} className="p-4">
                <StudentForm
                  initialValue={toFormShape(s)}
                  submitLabel="Save"
                  onCancel={() => setEditingId(null)}
                  onSubmit={(form) => handleUpdate(s.id, form)}
                />
              </div>
            ) : (
              <div key={s.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <Link
                    to={`/teacher/students/${s.id}`}
                    className="font-medium text-slate-800 hover:text-indigo-600 hover:underline"
                  >
                    {s.first_name} {s.last_name}
                  </Link>
                  <p className="text-xs text-slate-500">ID: {s.student_number}</p>
                </div>
                <div className="flex gap-3 text-sm">
                  <button
                    onClick={() => setEditingId(s.id)}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
