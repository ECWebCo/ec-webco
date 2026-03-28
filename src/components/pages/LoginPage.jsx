import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

const inputStyle = {
  width: '100%', padding: '11px 14px',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  fontSize: 14, fontFamily: 'inherit', color: 'var(--text)',
  background: 'var(--bg)', outline: 'none', transition: 'border-color 0.15s'
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
      <div style={{ width: 44, height: 44, background: 'var(--gold)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: '#fff', flexShrink: 0 }}>EC</div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>EC Web Co</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>Website Manager</div>
      </div>
    </div>
  )
}

function Card({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 16 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 40, width: '100%', maxWidth: 380 }}>
        {children}
      </div>
    </div>
  )
}

function SubmitBtn({ label, loadingLabel, loading }) {
  return (
    <button type="submit" disabled={loading} style={{
      width: '100%', padding: 13, background: loading ? 'var(--subtle)' : 'var(--gold)',
      color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
      fontSize: 15, fontWeight: 500, cursor: loading ? 'wait' : 'pointer',
      fontFamily: 'inherit', transition: 'background 0.15s', marginTop: 4
    }}>
      {loading ? loadingLabel : label}
    </button>
  )
}

function ErrorBox({ error }) {
  if (!error) return null
  return (
    <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 16 }}>
      {error}
    </div>
  )
}

export default function LoginPage() {
  const { signIn } = useAuth()
  const [view, setView] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery') || hash.includes('type=invite') || hash.includes('type=signup')) {
      setView('reset')
    }
  }, [])

  async function handleSignIn(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError('Incorrect email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/'
      })
      if (error) throw error
      setView('done')
      setMessage('Check your email for a password reset link.')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSetPassword(e) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setView('done')
      setMessage('Password set! You can now sign in.')
      setTimeout(() => setView('login'), 2000)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (view === 'reset') return (
    <Card>
      <Logo />
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Set your password</h1>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28 }}>Choose a password to access your dashboard</p>
      <form onSubmit={handleSetPassword}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>New password</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters" style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>Confirm password</label>
          <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••" style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
        <ErrorBox error={error} />
        <SubmitBtn label="Set Password" loadingLabel="Saving…" loading={loading} />
      </form>
    </Card>
  )

  if (view === 'forgot') return (
    <Card>
      <Logo />
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Reset your password</h1>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28 }}>Enter your email and we'll send you a reset link</p>
      <form onSubmit={handleForgotPassword}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>Email address</label>
          <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@restaurant.com" style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
        <ErrorBox error={error} />
        <SubmitBtn label="Send Reset Link" loadingLabel="Sending…" loading={loading} />
      </form>
      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
        <button onClick={() => setView('login')} style={{ background: 'none', border: 'none', color: 'var(--gold-dark)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
          Back to sign in
        </button>
      </p>
    </Card>
  )

  if (view === 'done') return (
    <Card>
      <Logo />
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✉</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Check your email</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>{message}</p>
        <button onClick={() => setView('login')} style={{ background: 'none', border: 'none', color: 'var(--gold-dark)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
          Back to sign in
        </button>
      </div>
    </Card>
  )

  return (
    <Card>
      <Logo />
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Welcome back</h1>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28 }}>Sign in to manage your restaurant website</p>
      <form onSubmit={handleSignIn}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>Email address</label>
          <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@restaurant.com" style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>Password</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
        <div style={{ textAlign: 'right', marginBottom: 20 }}>
          <button type="button" onClick={() => setView('forgot')} style={{ background: 'none', border: 'none', color: 'var(--gold-dark)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
            Forgot password?
          </button>
        </div>
        <ErrorBox error={error} />
        <SubmitBtn label="Sign In" loadingLabel="Signing in..." loading={loading} />
      </form>
      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--muted)' }}>
        Need access? Contact <a href="mailto:evan@ecwebco.com" style={{ color: 'var(--gold-dark)' }}>evan@ecwebco.com</a>
      </p>
    </Card>
  )
}
