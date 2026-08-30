import { useState } from 'react'

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function toDateString(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// `new Date('2026-03-04')` is parsed as UTC and can land on the previous day once it is
// read back in a western timezone. Pinning the time keeps it local.
function parseLocal(dateString) {
  return new Date(`${dateString}T00:00:00`)
}

function buildWeeks(firstAttended) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start at the first of the month the student first attended — never earlier — then
  // walk back to the preceding Sunday so every column is a full Sun→Sat week.
  const cursor = new Date(firstAttended.getFullYear(), firstAttended.getMonth(), 1)
  cursor.setDate(cursor.getDate() - cursor.getDay())

  const days = []
  // Runs past today until the next Sunday, padding out the trailing partial week.
  while (cursor <= today || cursor.getDay() !== 0) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  const weeks = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return weeks
}

function dayLabel(day, isPresent, isFuture) {
  const pretty = day.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return isFuture ? pretty : `${pretty} — ${isPresent ? 'Present' : 'Absent'}`
}

export default function ContributionCalendar({ dates }) {
  const [tip, setTip] = useState(null) // { text, x, y, below }

  if (dates.length === 0) return null

  const present = new Set(dates)
  const today = toDateString(new Date())
  const weeks = buildWeeks(parseLocal(dates[0]))

  function showTip(e, text) {
    const r = e.currentTarget.getBoundingClientRect()
    // Keep the tooltip on screen: clamp horizontally, and flip below the square when
    // there isn't room above it.
    const halfWidth = text.length * 3.4 + 10
    const x = Math.min(
      Math.max(r.left + r.width / 2, halfWidth + 4),
      window.innerWidth - halfWidth - 4
    )
    const below = r.top < 40
    setTip({ text, x, y: below ? r.bottom + 6 : r.top - 6, below })
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg p-4">
        <div className="inline-flex gap-1">
          {weeks.map((week, wi) => {
            const firstDay = week[0]
            const showLabel = wi === 0 || firstDay.getMonth() !== weeks[wi - 1][0].getMonth()
            return (
              <div key={wi} className="flex flex-col gap-1">
                <div className="h-4 text-[10px] leading-4 text-slate-400 whitespace-nowrap">
                  {showLabel ? monthNames[firstDay.getMonth()] : ''}
                </div>
                {week.map((day, di) => {
                  const ds = toDateString(day)
                  const isFuture = ds > today
                  const isPresent = present.has(ds)
                  return (
                    <div
                      key={di}
                      onMouseEnter={(e) => showTip(e, dayLabel(day, isPresent, isFuture))}
                      onMouseLeave={() => setTip(null)}
                      className={`w-4 h-4 rounded-sm cursor-default hover:ring-2 hover:ring-slate-400 ${
                        isPresent ? 'bg-green-500' : isFuture ? 'bg-slate-50' : 'bg-slate-200'
                      }`}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>Absent</span>
        <span className="w-4 h-4 rounded-sm bg-slate-200 inline-block" />
        <span className="w-4 h-4 rounded-sm bg-green-500 inline-block" />
        <span>Present</span>
      </div>

      {tip && (
        <div
          className={`fixed z-50 pointer-events-none -translate-x-1/2 bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg ${
            tip.below ? '' : '-translate-y-full'
          }`}
          style={{ left: tip.x, top: tip.y }}
        >
          {tip.text}
        </div>
      )}
    </div>
  )
}
