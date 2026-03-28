import { useState } from 'react'
import { supabase } from '../../lib/supabase'

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
      <img src="/ec-logo.png" alt="EC Web Co" style={{ height: 36, flexShrink: 0 }} />
    </div>
  )
}

export default function SetupPage() {
  const params = new URLSearchParams(window.location.search)
  const prefillEmail = params.get('email') || ''

  const [email, setEmail] = useState(prefillEmail)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    fontSize: 14, fontFamily: 'inherit', color: 'var(--text)',
    background: 'var(--bg)', outline: 'none', transition: 'border-color 0.15s'
  }

  async function handleSetup(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://manage.ecwebco.com'
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 16 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 40, width: '100%', maxWidth: 380 }}>
        <Logo />

        {sent ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✉</div>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Check your email</h1>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24 }}>
              We sent a password setup link to <strong>{email}</strong>. Click it to create your password and access your dashboard.
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>
              Didn't get it? Check your spam folder or{' '}
              <button onClick={() => setSent(false)} style={{ background: 'none', border: 'none', color: 'var(--gold-dark)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                try again
              </button>
            </p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Set up your account</h1>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.6 }}>
              Enter your email and we'll send you a link to create your password.
            </p>
            <form onSubmit={handleSetup}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>Email address</label>
                <input
                  type="email" required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@restaurant.com"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              {error && (
                <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 16 }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: 13, background: loading ? 'var(--subtle)' : 'var(--gold)',
                color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
                fontSize: 15, fontWeight: 500, cursor: loading ? 'wait' : 'pointer',
                fontFamily: 'inherit', transition: 'background 0.15s'
              }}>
                {loading ? 'Sending...' : 'Send Setup Link'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--muted)' }}>
              Already have an account?{' '}
              <a href="/" style={{ color: 'var(--gold-dark)' }}>Sign in</a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
