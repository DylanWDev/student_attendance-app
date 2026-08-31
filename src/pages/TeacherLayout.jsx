import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../libs/api.js'

const tabs = [
  { to: '/teacher/dashboard', label: 'Dashboard' },
  { to: '/teacher/roster', label: 'Roster' },
  { to: '/teacher/password', label: "Today's Password" },
  { to: '/teacher/location', label: 'Classroom' },
]

export default function TeacherLayout() {
  const [status, setStatus] = useState('loading') // 'loading' | 'authenticated' | 'anonymous'
  const navigate = useNavigate()

  useEffect(() => {
    apiGet('/teacher/session')
      .then((res) => setStatus(res.authenticated ? 'authenticated' : 'anonymous'))
      .catch(() => setStatus('anonymous'))
  }, [])

  async function handleLogout() {
    await apiPost('/teacher/logout', {})
    navigate('/teacher', { replace: true })
  }

  if (status === 'loading') {
    return <div className="min-h-screen bg-slate-50" />
  }

  if (status === 'anonymous') {
    return <Navigate to="/teacher" replace />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">Attendance</h1>
          <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-700">
            Log out
          </button>
        </div>
        <nav className="max-w-4xl mx-auto px-4 flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `whitespace-nowrap py-2.5 text-sm font-medium border-b-2 ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
