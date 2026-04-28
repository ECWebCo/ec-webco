import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './components/pages/LoginPage'
import SetupPage from './components/pages/SetupPage'
import DashboardLayout from './components/layout/DashboardLayout'
import DashboardPage from './components/pages/DashboardPage'
import MenuPage from './components/pages/MenuPage'
import BrandingPage from './components/pages/BrandingPage'
import StorefrontsPage from './components/pages/StorefrontsPage'
import AdminPage from './components/pages/AdminPage'
import NotFoundPage from './components/pages/NotFoundPage'

function HomeRoute() {
  const { session } = useAuth()
  if (session?.user?.email === 'evan@ecwebco.com') {
    return <Navigate to="/admin" replace />
  }
  return <DashboardPage />
}

function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  const hasAuthToken = window.location.hash.includes('access_token') || window.location.search.includes('code=')
  if (loading || hasAuthToken)
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)', fontSize: 14 }}>
        Loading…
      </div>
    )
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
        <Route index element={<HomeRoute />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="branding" element={<BrandingPage />} />
        <Route path="storefronts" element={<StorefrontsPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
