import { useState, useEffect } from 'react'

/* ── Button ── */
export function Button({ children, variant = 'ghost', size = 'md', onClick, disabled, style, type = 'button' }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontFamily: 'inherit', fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', borderRadius: 'var(--radius-sm)', transition: 'all 0.15s',
    opacity: disabled ? 0.5 : 1,
  }
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '9px 18px', fontSize: 14 },
    lg: { padding: '12px 26px', fontSize: 15 },
  }
  const variants = {
    primary: { background: 'var(--gold)', color: '#fff' },
    ghost: { background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)' },
    danger: { background: 'var(--danger-bg)', color: 'var(--danger)' },
    success: { background: 'var(--success-bg)', color: 'var(--success)' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {children}
    </button>
  )
}

/* ── Toggle ── */
export function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
      <span style={{ position: 'relative', width: 40, height: 22, flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
        <span style={{
          position: 'absolute', inset: 0,
          background: checked ? 'var(--success)' : 'var(--border)',
          borderRadius: 11, transition: '0.2s', cursor: 'pointer'
        }} />
        <span style={{
          position: 'absolute', width: 16, height: 16,
          left: checked ? 21 : 3, top: 3,
          background: '#fff', borderRadius: '50%', transition: '0.2s', pointerEvents: 'none'
        }} />
      </span>
      {label && <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>}
    </label>
  )
}

/* ── Modal ── */
export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 28, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
        {title && <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 20 }}>{title}</h2>}
        {children}
        {footer && <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>{footer}</div>}
      </div>
    </div>
  )
}

/* ── Field ── */
export function Field({ label, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>}
      {children}
    </div>
  )
}

export const inputStyle = {
  width: '100%', padding: '9px 12px',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  fontSize: 14, fontFamily: 'inherit', color: 'var(--text)',
  background: 'var(--bg)', outline: 'none', transition: 'border-color 0.15s'
}

/* ── Toast ── */
let toastFn = null
export function setToastFn(fn) { toastFn = fn }
export function toast(msg, type = 'success') { toastFn?.(msg, type) }

export function ToastContainer() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    setToastFn((msg, type) => {
      const id = Date.now()
      setToasts(t => [...t, { id, msg, type }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
    })
  }, [])

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '12px 18px', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500,
          background: t.type === 'error' ? 'var(--danger)' : '#1A1A1A',
          color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'slideIn 0.2s ease'
        }}>
          {t.msg}
        </div>
      ))}
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}

/* ── Page Header ── */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* ── Card ── */
export function Card({ children, style, padding = '20px 22px' }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding, ...style }}>
      {children}
    </div>
  )
}

/* ── Spinner ── */
export function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
