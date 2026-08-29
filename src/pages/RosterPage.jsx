import { useEffect, useState } from 'react'
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

export default function RosterPage() {
  const [students, setStudents] = useState(null)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)

  function loadStudents() {
    apiGet('/teacher/students')
      .then(setStudents)
      .catch(() => setError('Could not load the roster.'))
  }

  useEffect(loadStudents, [])

  async function handleAdd(form) {
    await apiPost('/teacher/students', form)
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Add a student</h2>
        <StudentForm onSubmit={handleAdd} />
      </div>

      {error && <FriendlyError message={error} />}

      {!students ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : students.length === 0 ? (
        <p className="text-slate-500 text-sm">No students yet — add your first one above.</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {students.map((s) =>
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
                  <p className="font-medium text-slate-800">
                    {s.first_name} {s.last_name}
                  </p>
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
