import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { PageHeader, Button, Card, Modal, Field, inputStyle, toast, Spinner } from '../ui'

export default function AdminPage() {
  const { manageRestaurant } = useAuth()
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [addModal, setAddModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(null)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [welcomeModal, setWelcomeModal] = useState(null)
  const [paymentModal, setPaymentModal] = useState(null)
  const [welcomeEmail, setWelcomeEmail] = useState('')
  const [stripeLink, setStripeLink] = useState('')
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    load()
    const handleClick = () => setOpenDropdown(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false })
    setRestaurants(data || [])
    setLoading(false)
  }

  async function handleAdd() {
    if (!form.name || !form.slug) return
    setSaving(true)
    try {
      const { error } = await supabase.from('restaurants')
        .insert({ name: form.name, slug: form.slug.toLowerCase().replace(/\s+/g, '-') })
      if (error) throw error
      toast('Restaurant added!')
      setAddModal(false)
      setForm({ name: '', slug: '' })
      load()
    } catch (err) {
      toast(err.message || 'Failed to add', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteModal) return
    setDeleting(true)
    try {
      await supabase.from('menu_items').delete().eq('restaurant_id', deleteModal.id)
      await supabase.from('menu_sections').delete().eq('restaurant_id', deleteModal.id)
      await supabase.from('hours').delete().eq('restaurant_id', deleteModal.id)
      await supabase.from('links').delete().eq('restaurant_id', deleteModal.id)
      await supabase.from('photos').delete().eq('restaurant_id', deleteModal.id)
      await supabase.from('analytics_events').delete().eq('restaurant_id', deleteModal.id)
      const { error } = await supabase.from('restaurants').delete().eq('id', deleteModal.id)
      if (error) throw error
      toast('Restaurant deleted')
      setDeleteModal(null)
      load()
    } catch (err) {
      toast(err.message || 'Failed to delete', 'error')
    } finally {
      setDeleting(false)
    }
  }

  async function handleManage(r) {
    if (manageRestaurant) await manageRestaurant(r.id)
    navigate('/')
  }

  async function handleSendWelcome() {
    if (!welcomeEmail || !welcomeModal) return
    setSending(true)
    try {
      const res = await fetch('/api/onboard-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: welcomeEmail, restaurantName: welcomeModal.name, restaurantId: welcomeModal.id })
      })
      if (!res.ok) throw new Error('Failed to send')
      toast('Welcome email sent!')
      setWelcomeModal(null)
      setWelcomeEmail('')
      load()
    } catch (err) {
      toast(err.message || 'Failed to send email', 'error')
    } finally {
      setSending(false)
    }
  }

  async function handleSendPayment() {
    if (!stripeLink || !paymentModal) return
    setSending(true)
    try {
      const res = await fetch('/api/send-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantName: paymentModal.name, restaurantId: paymentModal.id, stripeLink })
      })
      if (!res.ok) throw new Error('Failed to send')
      toast('Payment email sent!')
      setPaymentModal(null)
      setStripeLink('')
    } catch (err) {
      toast(err.message || 'Failed to send', 'error')
    } finally {
      setSending(false)
    }
  }

  function autoSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  if (loading) return <div style={{ padding: 28 }}><Spinner /></div>

  return (
    <div style={{ padding: '24px 28px 32px' }}>
      <PageHeader
        title="Admin"
        subtitle="Manage all restaurant clients"
        action={<Button variant="primary" onClick={() => setAddModal(true)}>+ Add Restaurant</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <Card style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Total Clients</div>
          <div style={{ fontSize: 26, fontWeight: 600 }}>{restaurants.length}</div>
        </Card>
        <Card style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Active</div>
          <div style={{ fontSize: 26, fontWeight: 600 }}>{restaurants.filter(r => r.owner_id).length}</div>
        </Card>
        <Card style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Pending</div>
          <div style={{ fontSize: 26, fontWeight: 600 }}>{restaurants.filter(r => !r.owner_id).length}</div>
        </Card>
      </div>

      <Card style={{ padding: 0, overflow: 'visible' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', gap: 16, padding: '12px 20px', background: '#FAFAF8', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderRadius: 'var(--radius) var(--radius) 0 0' }}>
          <div>Restaurant</div>
          <div>Slug</div>
          <div>Status</div>
          <div>Created</div>
          <div>Actions</div>
        </div>

        {restaurants.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
            No restaurants yet. Add your first client!
          </div>
        )}

        {restaurants.map((r, i) => (
          <div key={r.id} style={{
            display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto',
            gap: 16, padding: '16px 20px', alignItems: 'center',
            borderBottom: i < restaurants.length - 1 ? '1px solid var(--border)' : 'none'
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{r.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{r.id.slice(0, 8)}...</div>
            </div>
            <code style={{ fontSize: 12, background: 'var(--bg)', padding: '3px 8px', borderRadius: 4, color: 'var(--muted)' }}>{r.slug}</code>
            <div>
              {r.owner_id
                ? <span style={{ fontSize: 11, padding: '3px 10px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 20, fontWeight: 500 }}>● Active</span>
                : <span style={{ fontSize: 11, padding: '3px 10px', background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 20, fontWeight: 500 }}>○ Pending</span>
              }
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
              <Button size="sm" variant="ghost" onClick={() => setOpenDropdown(openDropdown === r.id ? null : r.id)}>
                Actions ▾
              </Button>
              {openDropdown === r.id && (
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', zIndex: 100, minWidth: 180, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {[
                    { label: 'View Site', action: () => window.open(`https://preview.ecwebco.com/${r.slug}`, '_blank') },
                    { label: 'Manage', action: () => handleManage(r) },
                    { label: 'Send Welcome Email', action: () => { setWelcomeModal(r); setWelcomeEmail('') } },
                    { label: 'Send Payment Link', action: () => { setPaymentModal(r); setStripeLink('') } },
                    { label: 'Delete', action: () => setDeleteModal(r), danger: true },
                  ].map((item, idx) => (
                    <button key={idx} onClick={() => { item.action(); setOpenDropdown(null) }} style={{
                      display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left',
                      background: 'none', border: 'none',
                      borderBottom: idx < 4 ? '1px solid var(--border)' : 'none',
                      fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                      color: item.danger ? 'var(--danger)' : 'var(--text)'
                    }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--bg)'}
                      onMouseOut={e => e.currentTarget.style.background = 'none'}
                    >{item.label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </Card>

      {/* Add Restaurant Modal - name and slug only */}
      <Modal open={addModal} onClose={() => { setAddModal(false); setForm({ name: '', slug: '' }) }}
        title="Add New Restaurant"
        footer={<>
          <Button variant="ghost" onClick={() => setAddModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd} disabled={!form.name || !form.slug || saving}>
            {saving ? 'Adding...' : 'Add Restaurant'}
          </Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Restaurant name">
            <input value={form.name} onChange={e => { const name = e.target.value; setForm(f => ({ ...f, name, slug: autoSlug(name) })) }}
              placeholder="e.g. La Bella Cucina" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </Field>
          <Field label="URL Slug">
            <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              placeholder="e.g. la-bella-cucina" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Preview: preview.ecwebco.com/{form.slug || 'your-slug'}</div>
          </Field>
        </div>
      </Modal>

      {/* Send Welcome Email Modal */}
      <Modal open={!!welcomeModal} onClose={() => { setWelcomeModal(null); setWelcomeEmail('') }}
        title={`Send Welcome Email — ${welcomeModal?.name}`}
        footer={<>
          <Button variant="ghost" onClick={() => setWelcomeModal(null)}>Cancel</Button>
          <Button variant="primary" onClick={handleSendWelcome} disabled={!welcomeEmail || sending}>
            {sending ? 'Sending...' : 'Send Welcome Email'}
          </Button>
        </>}>
        <Field label="Client's email address">
          <input type="email" value={welcomeEmail} onChange={e => setWelcomeEmail(e.target.value)}
            placeholder="owner@restaurant.com" style={inputStyle} autoFocus
            onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </Field>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
          Sends a magic link to access their dashboard. No password needed — they just click the link.
        </p>
      </Modal>

      {/* Send Payment Link Modal */}
      <Modal open={!!paymentModal} onClose={() => { setPaymentModal(null); setStripeLink('') }}
        title={`Send Payment Link — ${paymentModal?.name}`}
        footer={<>
          <Button variant="ghost" onClick={() => setPaymentModal(null)}>Cancel</Button>
          <Button variant="primary" onClick={handleSendPayment} disabled={!stripeLink || sending}>
            {sending ? 'Sending...' : 'Send Payment Email'}
          </Button>
        </>}>
        <Field label="Stripe payment link">
          <input type="url" value={stripeLink} onChange={e => setStripeLink(e.target.value)}
            placeholder="https://buy.stripe.com/..." style={inputStyle} autoFocus
            onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </Field>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
          Sends a follow-up email with the Stripe payment link to go live.
        </p>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Restaurant"
        footer={<>
          <Button variant="ghost" onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </Button>
        </>}>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
          Are you sure you want to delete <strong style={{ color: 'var(--text)' }}>{deleteModal?.name}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
