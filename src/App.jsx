import { Route, Routes } from 'react-router-dom'
import CheckInPage from './pages/CheckInPage.jsx'
import TeacherGatePage from './pages/TeacherGatePage.jsx'
import TeacherLayout from './pages/TeacherLayout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import RosterPage from './pages/RosterPage.jsx'
import DailyPasswordPage from './pages/DailyPasswordPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CheckInPage />} />
      <Route path="/teacher">
        <Route index element={<TeacherGatePage />} />
        <Route element={<TeacherLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="roster" element={<RosterPage />} />
          <Route path="password" element={<DailyPasswordPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
