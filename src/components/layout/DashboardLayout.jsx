import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ToastContainer, Modal, Button, Field, inputStyle } from '../ui'

const NAV = [
  { to: '/',       label: 'Dashboard', icon: IconDashboard,  end: true },
  { to: '/menu',   label: 'Menu',      icon: IconMenu },
  { to: '/hours',  label: 'Hours',     icon: IconClock },
  { to: '/links',  label: 'Links',     icon: IconLink },
  { to: '/photos', label: 'Photos',    icon: IconPhoto },
  { to: '/admin',  label: 'Admin',     icon: IconAdmin },
{ to: '/mockup', label: 'Mockup', icon: IconMockup },
]

export default function DashboardLayout() {
  const { restaurant, session, signOut } = useAuth()
  const navigate = useNavigate()
  const [requestOpen, setRequestOpen] = useState(false)
  const [requestText, setRequestText] = useState('')
  const [requestSent, setRequestSent] = useState(false)
  const [requestSending, setRequestSending] = useState(false)

  function handleSignOut() {
    signOut()
    navigate('/login')
  }

  async function handleSendRequest() {
    if (!requestText.trim()) return
    setRequestSending(true)
    try {
      const res = await fetch('/api/request-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: requestText,
          email: session?.user?.email,
          restaurantName: restaurant?.name
        })
      })
      if (!res.ok) throw new Error('Failed')
      setRequestSent(true)
      setTimeout(() => { setRequestOpen(false); setRequestSent(false); setRequestText('') }, 2000)
    } catch (err) {
      alert('Failed to send. Please email us at evan@ecwebco.com')
    } finally {
      setRequestSending(false)
    }
  }

  const initials = restaurant?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'R'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Sidebar (desktop) ── */}
      <aside style={{
        width: 'var(--sidebar-w)', flexShrink: 0,
        background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        '@media(max-width:680px)': { display: 'none' }
      }} className="sidebar-desktop">
        {/* Logo */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/ec-logo.png" alt="EC Web Co" style={{ height: 28, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>EC Web Co</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Website Manager</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '14px 10px', flex: 1 }}>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              marginBottom: 2, fontSize: 14, fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--gold-dark)' : 'var(--muted)',
              background: isActive ? 'var(--gold-light)' : 'transparent',
              textDecoration: 'none', transition: 'all 0.15s'
            })}>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '14px 10px', borderTop: '1px solid var(--border)' }}>
          <button onClick={() => setRequestOpen(true)} style={{
            width: '100%', padding: '9px 12px', background: 'var(--gold-light)',
            border: '1px solid #E8D49A', borderRadius: 'var(--radius-sm)',
            color: 'var(--gold-dark)', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10, textAlign: 'left'
          }}>✦ Request a Change</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{restaurant?.name || 'My Restaurant'}</div>
              <div style={{ fontSize: 10 }}><span style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 500 }}>● Live</span></div>
            </div>
            <button onClick={handleSignOut} title="Sign out" style={{ background: 'none', border: 'none', color: 'var(--subtle)', cursor: 'pointer', fontSize: 16, padding: '2px 4px', lineHeight: 1 }}>⏻</button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="main-content">
        <Outlet context={{ openRequest: () => setRequestOpen(true) }} />
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-nav" style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        zIndex: 50, padding: '8px 0'
      }}>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, padding: '4px 0', fontSize: 10, textDecoration: 'none',
            color: isActive ? 'var(--gold-dark)' : 'var(--muted)',
            fontWeight: isActive ? 500 : 400
          })}>
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ── Request Change Modal ── */}
      <Modal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Request a Change"
        footer={
          requestSent ? null : <>
            <Button variant="ghost" onClick={() => setRequestOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSendRequest} disabled={!requestText.trim()}>Send Request</Button>
          </>
        }
      >
        {requestSent ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--success)', fontSize: 15 }}>
            ✓ Request sent! We'll be in touch soon.
          </div>
        ) : (
          <Field label="What would you like changed?">
            <textarea
              value={requestText}
              onChange={e => setRequestText(e.target.value)}
              placeholder="e.g. Can you update our logo? We moved locations and need the address updated. We'd like a new Happy Hour section on the menu..."
              style={{ ...inputStyle, height: 120, resize: 'vertical', lineHeight: 1.5 }}
            />
          </Field>
        )}
      </Modal>

      <ToastContainer />

      <style>{`
        @media (max-width: 680px) {
          .sidebar-desktop { display: none !important; }
          .mobile-nav { display: flex !important; }
          .main-content { padding-bottom: 72px; }
        }
      `}</style>
    </div>
  )
}

/* ── Icons (inline SVG) ── */
function IconDashboard({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <rect x="1" y="1" width="7" height="7" rx="2" fill="currentColor" opacity=".9"/>
    <rect x="10" y="1" width="7" height="7" rx="2" fill="currentColor" opacity=".5"/>
    <rect x="1" y="10" width="7" height="7" rx="2" fill="currentColor" opacity=".5"/>
    <rect x="10" y="10" width="7" height="7" rx="2" fill="currentColor" opacity=".9"/>
  </svg>
}
function IconMenu({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path d="M2 4h14M2 9h14M2 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
}
function IconClock({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 5v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
}
function IconLink({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path d="M7 11l4-4M10 7h3V4M8 4H5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
}
function IconAdmin({ size = 18 }) {
  return <svg width={size} height={size} viewBox='0 0 18 18' fill='none'>
    <circle cx='9' cy='6' r='3' stroke='currentColor' strokeWidth='1.5'/>
    <path d='M2 16c0-3.3 3.1-6 7-6s7 2.7 7 6' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round'/>
  </svg>
}
function IconPhoto({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <rect x="1" y="3" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="6" cy="8" r="1.5" fill="currentColor"/>
    <path d="M1 13l4-4 3 3 3-3 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
}
function IconMockup({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <rect x="1" y="3" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 7h8M5 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
}