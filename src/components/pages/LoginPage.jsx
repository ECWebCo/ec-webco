import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: 'https://manage.ecwebco.com' }
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            EC Web Co
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Restaurant Manager</div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '32px 28px' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>Check your email</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24 }}>
                We sent a login link to <strong>{email}</strong>. Click the link to sign in — no password needed.
              </div>
              <button onClick={() => { setSent(false); setEmail('') }}
                style={{ background: 'none', border: 'none', color: 'var(--gold-dark)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Sign in</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>Enter your email and we'll send you a login link.</div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@restaurant.com" required autoFocus
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontFamily: 'inherit', color: 'var(--text)', background: 'var(--bg)', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              {error && <div style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 12 }}>{error}</div>}

              <button type="submit" disabled={!email || loading} style={{
                width: '100%', padding: '11px', background: 'var(--gold)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500,
                fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
              }}>
                {loading ? 'Sending...' : 'Send Login Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
