import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { PageHeader, Button, Card, Modal, Field, inputStyle, toast, Spinner, Toggle } from '../ui'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const timeInput = { padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontFamily: 'inherit', color: 'var(--text)', background: 'var(--bg)', width: 110 }

function defaultHours() {
  return DAYS.map((_, i) => ({ day_of_week: i, open_time: '11:00', close_time: '21:00', closed: i === 1 }))
}

function StorefrontForm({ form, setForm, hours, updateHour }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Storefront name">
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Montrose, The Heights, Downtown..." style={inputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </Field>
      <Field label="Address">
        <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          placeholder="e.g. 1234 Westheimer Rd, Houston TX 77006" style={inputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </Field>

      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: 16 }}>Contact & Links</div>
      <Field label="Phone number">
        <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          placeholder="(713) 555-0100" style={{ ...inputStyle, width: 200 }}
          onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </Field>
      <Field label="Order online URL">
        <input type="url" value={form.order_url} onChange={e => setForm(f => ({ ...f, order_url: e.target.value }))}
          placeholder="https://order.restaurant.com" style={inputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </Field>
      <Field label="Reservation URL">
        <input type="url" value={form.reservation_url} onChange={e => setForm(f => ({ ...f, reservation_url: e.target.value }))}
          placeholder="https://resy.com/restaurant" style={inputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </Field>

      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: 16 }}>Hours</div>
      {hours.map((row, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < 6 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ width: 90, fontSize: 13, fontWeight: 500 }}>{DAYS[i]}</div>
          {row.closed ? (
            <span style={{ fontSize: 11, padding: '3px 10px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 20 }}>Closed</span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <input type="time" value={row.open_time || ''} onChange={e => updateHour(i, 'open_time', e.target.value)} style={timeInput} />
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>to</span>
              <input type="time" value={row.close_time || ''} onChange={e => updateHour(i, 'close_time', e.target.value)} style={timeInput} />
            </div>
          )}
          <Toggle checked={!row.closed} onChange={v => updateHour(i, 'closed', !v)} />
        </div>
      ))}
    </div>
  )
}

export default function StorefrontsPage() {
  const { restaurant } = useAuth()
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', phone: '', order_url: '', reservation_url: '' })
  const [hours, setHours] = useState(defaultHours())

  useEffect(() => { if (restaurant?.id) load() }, [restaurant?.id])

  async function load() {
    setLoading(true)
    const { data: locs } = await supabase
      .from('locations')
      .select('*, location_hours(*), location_links(*)')
      .eq('restaurant_id', restaurant.id)
      .order('sort_order')

    // Auto-create first storefront if none exist
    if (!locs || locs.length === 0) {
      await supabase.from('locations').insert({
        restaurant_id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address || '',
        sort_order: 0
      })
      const { data: newLocs } = await supabase
        .from('locations')
        .select('*, location_hours(*), location_links(*)')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order')
      setLocations(newLocs || [])
    } else {
      setLocations(locs)
    }
    setLoading(false)
  }

  function openAdd() {
    setForm({ name: '', address: '', phone: '', order_url: '', reservation_url: '' })
    setHours(defaultHours())
    setAddModal(true)
  }

  function openEdit(loc) {
    setForm({
      name: loc.name || '',
      address: loc.address || '',
      phone: loc.location_links?.[0]?.phone || '',
      order_url: loc.location_links?.[0]?.order_url || '',
      reservation_url: loc.location_links?.[0]?.reservation_url || '',
    })
    const h = loc.location_hours?.length > 0
      ? DAYS.map((_, i) => loc.location_hours.find(h => h.day_of_week === i) || { day_of_week: i, open_time: '11:00', close_time: '21:00', closed: false })
      : defaultHours()
    setHours(h)
    setEditModal(loc)
  }

  async function handleSave(isEdit = false) {
    setSaving(true)
    try {
      let locId
      if (isEdit) {
        console.log('Saving edit for location ID:', editModal?.id)
        await supabase.from('locations').update({ name: form.name, address: form.address }).eq('id', editModal.id)
        locId = editModal.id
        await supabase.from('location_hours').delete().eq('location_id', locId)
        await supabase.from('location_links').delete().eq('location_id', locId)
      } else {
        const { data } = await supabase.from('locations')
          .insert({ restaurant_id: restaurant.id, name: form.name, address: form.address, sort_order: locations.length })
          .select().single()
        locId = data.id
      }
      const cleanHours = hours.map(h => ({
        location_id: locId,
        day_of_week: h.day_of_week,
        open_time: h.open_time || null,
        close_time: h.close_time || null,
        closed: h.closed || false
      }))
      const { error: hoursError } = await supabase.from('location_hours').insert(cleanHours)
      if (hoursError) console.error('Hours error:', hoursError)
      if (form.phone || form.order_url || form.reservation_url) {
        await supabase.from('location_links').insert({
          location_id: locId,
          phone: form.phone || null,
          order_url: form.order_url || null,
          reservation_url: form.reservation_url || null
        })
      }
      toast(isEdit ? 'Storefront updated!' : 'Storefront added!')
      setAddModal(false)
      setEditModal(null)
      load()
    } catch (err) {
      toast(err.message || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (locations.length === 1) { toast('You must have at least one storefront', 'error'); return }
    if (!confirm('Delete this storefront?')) return
    await supabase.from('location_hours').delete().eq('location_id', id)
    await supabase.from('location_links').delete().eq('location_id', id)
    await supabase.from('locations').delete().eq('id', id)
    toast('Storefront deleted')
    load()
  }

  function updateHour(i, field, val) {
    setHours(h => h.map((row, idx) => idx === i ? { ...row, [field]: val } : row))
  }

  if (loading) return <div style={{ padding: 28 }}><Spinner /></div>

  return (
    <div style={{ padding: '24px 28px 32px' }}>
      <PageHeader
        title="Storefronts"
        subtitle="Manage your locations — each with its own hours, links and address"
        action={<Button variant="primary" onClick={openAdd}>+ Add Storefront</Button>}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {locations.map((loc, i) => (
          <Card key={loc.id} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', background: '#FAFAF8', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{loc.name || `Storefront ${i + 1}`}</div>
                {loc.address && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{loc.address}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="sm" variant="ghost" onClick={() => openEdit(loc)}>Edit</Button>
                {locations.length > 1 && <Button size="sm" variant="danger" onClick={() => handleDelete(loc.id)}>Delete</Button>}
              </div>
            </div>
            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Phone</div>
                <div style={{ fontSize: 13 }}>{loc.location_links?.[0]?.phone || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Order Link</div>
                <div style={{ fontSize: 13, color: loc.location_links?.[0]?.order_url ? 'var(--success)' : 'var(--muted)' }}>
                  {loc.location_links?.[0]?.order_url ? '✓ Set' : 'Not set'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Hours</div>
                <div style={{ fontSize: 13 }}>{loc.location_hours?.length > 0 ? `${loc.location_hours.filter(h => !h.closed).length} days open` : 'Not set'}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Storefront"
        footer={<>
          <Button variant="ghost" onClick={() => setAddModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => handleSave(false)} disabled={!form.name || saving}>{saving ? 'Saving...' : 'Add Storefront'}</Button>
        </>}>
        <StorefrontForm form={form} setForm={setForm} hours={hours} updateHour={updateHour} />
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Edit — ${editModal?.name || 'Storefront'}`}
        footer={<>
          <Button variant="ghost" onClick={() => setEditModal(null)}>Cancel</Button>
          <Button variant="primary" onClick={() => handleSave(true)} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </>}>
        <StorefrontForm form={form} setForm={setForm} hours={hours} updateHour={updateHour} />
      </Modal>
    </div>
  )
}
