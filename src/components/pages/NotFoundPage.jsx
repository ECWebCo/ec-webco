export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ width: 64, height: 64, background: 'var(--gold-light)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 28 }}>
          404
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Page not found</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.6 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a href="/" style={{
          display: 'inline-block', padding: '11px 24px',
          background: 'var(--gold)', color: '#fff', borderRadius: 'var(--radius-sm)',
          fontSize: 14, fontWeight: 500, textDecoration: 'none'
        }}>
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}

