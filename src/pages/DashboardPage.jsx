import { useEffect, useState } from 'react'
import { apiGet } from '../libs/api.js'
import AttendanceGrid from '../components/AttendanceGrid.jsx'

export default function DashboardPage() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiGet('/teacher/dashboard')
      .then(setRows)
      .catch(() => setError('Could not load attendance data.'))
  }, [])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!rows) return <p className="text-slate-500 text-sm">Loading…</p>

  return <AttendanceGrid rows={rows} />
}
