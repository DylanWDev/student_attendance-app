import { Link } from 'react-router-dom'

function todayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function AttendanceGrid({ rows }) {
  const today = todayString()

  const studentsById = new Map()
  const dates = new Set()
  const present = new Set() // `${studentId}|${date}`

  for (const row of rows) {
    if (!studentsById.has(row.id)) {
      studentsById.set(row.id, row)
    }
    if (row.attendance_date) {
      dates.add(row.attendance_date)
      present.add(`${row.id}|${row.attendance_date}`)
    }
  }

  const students = [...studentsById.values()]
  const sortedDates = [...dates].sort()
  const presentToday = students.filter((s) => present.has(`${s.id}|${today}`))

  if (students.length === 0) {
    return <p className="text-slate-500 text-sm">No students on the roster yet.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">
          Present today ({presentToday.length}/{students.length})
        </h2>
        {presentToday.length === 0 ? (
          <p className="text-sm text-slate-400">No check-ins yet today.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {presentToday.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/teacher/students/${s.id}`}
                  className="block text-sm bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 hover:bg-green-100"
                >
                  {s.first_name} {s.last_name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="sticky left-0 bg-slate-50 text-left px-3 py-2 font-semibold text-slate-700 whitespace-nowrap">
                Student
              </th>
              {sortedDates.map((date) => (
                <th key={date} className="px-3 py-2 font-medium text-slate-500 whitespace-nowrap">
                  {date.slice(5)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="sticky left-0 bg-white px-3 py-2 whitespace-nowrap font-medium text-slate-800">
                  <Link
                    to={`/teacher/students/${s.id}`}
                    className="hover:text-indigo-600 hover:underline"
                  >
                    {s.first_name} {s.last_name}
                  </Link>
                </td>
                {sortedDates.map((date) => (
                  <td key={date} className="px-3 py-2 text-center">
                    {present.has(`${s.id}|${date}`) ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-slate-200">·</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
