import { useState } from 'react'
import { Link } from 'react-router-dom'

function todayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function cellLines(dayRecord) {
  if (dayRecord.location_status !== 'verified') {
    return ['Present (location not confirmed)']
  }
  // Only ever resolved for a verified (confirmed in-range) check-in — an unverified day's
  // coordinates could point at a student's home, so no address line is shown for it.
  return dayRecord.address ? ['Present', `📍 ${dayRecord.address}`] : ['Present', '📍 Address unavailable']
}

export default function AttendanceGrid({ rows }) {
  const today = todayString()
  const [tip, setTip] = useState(null) // { lines, x, y, below }

  const studentsById = new Map()
  const dates = new Set()
  const byKey = new Map() // `${studentId}|${date}` -> { location_status, address }

  for (const row of rows) {
    if (!studentsById.has(row.id)) {
      studentsById.set(row.id, row)
    }
    if (row.attendance_date) {
      dates.add(row.attendance_date)
      const key = `${row.id}|${row.attendance_date}`
      byKey.set(key, { location_status: row.location_status, address: row.address })
    }
  }

  const students = [...studentsById.values()]
  const sortedDates = [...dates].sort()
  const presentToday = students.filter((s) => byKey.has(`${s.id}|${today}`))

  function showTip(e, lines) {
    const r = e.currentTarget.getBoundingClientRect()
    // Keep the tooltip on screen: clamp horizontally, and flip below the cell when there
    // isn't room above it. Measure the longest line, not just the first.
    const longest = Math.max(...lines.map((l) => l.length))
    const halfWidth = longest * 3.4 + 10
    const x = Math.min(
      Math.max(r.left + r.width / 2, halfWidth + 4),
      window.innerWidth - halfWidth - 4
    )
    const below = r.top < 40
    setTip({ lines, x, y: below ? r.bottom + 6 : r.top - 6, below })
  }

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
                {sortedDates.map((date) => {
                  const key = `${s.id}|${date}`
                  const dayRecord = byKey.get(key)
                  if (!dayRecord) {
                    return (
                      <td key={date} className="px-3 py-2 text-center">
                        <span className="text-slate-200">·</span>
                      </td>
                    )
                  }
                  const verified = dayRecord.location_status === 'verified'
                  return (
                    <td key={date} className="px-3 py-2 text-center">
                      <span
                        onMouseEnter={(e) => showTip(e, cellLines(dayRecord))}
                        onMouseLeave={() => setTip(null)}
                        className={`cursor-default ${verified ? 'text-green-600' : 'text-amber-500'}`}
                      >
                        ✓
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tip && (
        <div
          className={`fixed z-50 pointer-events-none -translate-x-1/2 bg-slate-800 text-white text-xs rounded px-2 py-1 shadow-lg ${
            tip.below ? '' : '-translate-y-full'
          }`}
          style={{ left: tip.x, top: tip.y }}
        >
          {tip.lines.map((line, i) => (
            <div key={i} className="whitespace-nowrap">
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
