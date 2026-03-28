import SetupPage from './components/pages/SetupPage'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './components/pages/LoginPage'
import DashboardLayout from './components/layout/DashboardLayout'
import DashboardPage from './components/pages/DashboardPage'
import MenuPage from './components/pages/MenuPage'
import HoursPage from './components/pages/HoursPage'
import LinksPage from './components/pages/LinksPage'
import PhotosPage from './components/pages/PhotosPage'
import AdminPage from './components/pages/AdminPage'
import NotFoundPage from './components/pages/NotFoundPage'

function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)', fontSize: 14 }}>Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { session, loading } = useAuth()

  if (loading) return null

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
<Route path="/setup" element={<SetupPage />} />
      <Route path="/" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
        <Route index element={<DashboardPage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="hours" element={<HoursPage />} />
        <Route path="links" element={<LinksPage />} />
        <Route path="photos" element={<PhotosPage />} />
      </Route>
<Route path="admin" element={<AdminPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
