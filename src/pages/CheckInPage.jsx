import { Link } from 'react-router-dom'
import CheckInForm from '../components/CheckInForm.jsx'

export default function CheckInPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-1">Attendance Check-In</h1>
        <p className="text-slate-500 text-center mb-6 text-sm">
          Enter your info and today&apos;s password to mark yourself present.
        </p>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <CheckInForm />
        </div>
        <p className="text-center mt-6">
          <Link to="/teacher" className="text-xs text-slate-400 hover:text-slate-600">
            Teacher login
          </Link>
        </p>
      </div>
    </div>
  )
}
