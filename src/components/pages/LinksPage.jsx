import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { PageHeader, Button, Field, inputStyle, Spinner, Card, toast } from '../ui'

export default function LinksPage() {
  const { restaurant } = useAuth()
  const [form, setForm] = useState({ order_url: '', reservation_url: '', phone: '' })
  const [linkId, setLinkId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (restaurant?.id) load() }, [restaurant?.id])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('links').select('*').eq('restaurant_id', restaurant.id).single()
    if (data) { setForm({ order_url: data.order_url || '', reservation_url: data.reservation_url || '', phone: data.phone || '' }); setLinkId(data.id) }
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    if (linkId) {
      await supabase.from('links').update({ ...form, updated_at: new Date().toISOString() }).eq('id', linkId)
    } else {
      const { data } = await supabase.from('links').insert({ ...form, restaurant_id: restaurant.id }).select().single()
      if (data) setLinkId(data.id)
    }
    toast('Links saved!')
    setSaving(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  if (loading) return <div style={{ padding: 28 }}><Spinner /></div>

  return (
    <div style={{ padding: '24px 28px 32px', maxWidth: 560 }}>
      <PageHeader title="Links" subtitle="Update your order, reservation, and contact links" />

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gap: 18, marginBottom: 24 }}>
          <Field label="Order Online URL">
            <input type="url" value={form.order_url} onChange={e => set('order_url', e.target.value)}
              placeholder="https://order.yourrestaurant.com" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </Field>
          <Field label="Reservation URL">
            <input type="url" value={form.reservation_url} onChange={e => set('reservation_url', e.target.value)}
              placeholder="https://resy.com/your-restaurant" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </Field>
          <Field label="Phone Number">
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="(555) 000-0000" style={{ ...inputStyle, width: 200 }}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </Field>
        </div>

        {/* Preview */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Button preview</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href={form.order_url || '#'} target="_blank" rel="noreferrer" style={{ padding: '12px 22px', background: 'var(--gold)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500, textDecoration: 'none', opacity: form.order_url ? 1 : 0.4 }}>
              🛒 Order Online
            </a>
            <a href={form.reservation_url || '#'} target="_blank" rel="noreferrer" style={{ padding: '12px 22px', background: 'var(--text)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500, textDecoration: 'none', opacity: form.reservation_url ? 1 : 0.4 }}>
              📅 Reserve a Table
            </a>
            <a href={form.phone ? `tel:${form.phone}` : '#'} style={{ padding: '12px 22px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500, textDecoration: 'none', opacity: form.phone ? 1 : 0.4 }}>
              📞 Call Us
            </a>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>These buttons appear on your live website. Click to test.</p>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="lg" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Links'}</Button>
      </div>
    </div>
  )
}
