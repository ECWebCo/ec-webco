import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader, Button, Modal, Field, inputStyle, toast, Card } from '../ui'

const STEPS = ['Restaurant', 'Menu', 'Hours', 'Links', 'Preview']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600,
              background: i < current ? 'var(--gold)' : i === current ? 'var(--gold)' : 'var(--bg)',
              color: i <= current ? '#fff' : 'var(--muted)',
              border: i > current ? '1px solid var(--border)' : 'none'
            }}>{i < current ? '✓' : i + 1}</div>
            <span style={{ fontSize: 11, color: i === current ? 'var(--gold-dark)' : 'var(--muted)', fontWeight: i === current ? 500 : 400 }}>{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 1, background: i < current ? 'var(--gold)' : 'var(--border)', margin: '0 8px', marginBottom: 22 }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function MockupPage() {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [restaurantId, setRestaurantId] = useState(null)

  const [info, setInfo] = useState({ name: '', tagline: '', description: '' })
  const [sections, setSections] = useState([{ name: 'Starters', items: [{ name: '', price: '', description: '' }] }])
  const [hours, setHours] = useState(DAYS.map((_, i) => ({ day_of_week: i, open_time: '11:00', close_time: '21:00', closed: i === 1 })))
  const [links, setLinks] = useState({ order_url: '', reservation_url: '', phone: '' })

  function addSection() {
    setSections(s => [...s, { name: '', items: [{ name: '', price: '', description: '' }] }])
  }
  function updateSection(i, val) {
    setSections(s => s.map((sec, idx) => idx === i ? { ...sec, name: val } : sec))
  }
  function addItem(si) {
    setSections(s => s.map((sec, idx) => idx === si ? { ...sec, items: [...sec.items, { name: '', price: '', description: '' }] } : sec))
  }
  function updateItem(si, ii, field, val) {
    setSections(s => s.map((sec, idx) => idx === si ? { ...sec, items: sec.items.map((it, iidx) => iidx === ii ? { ...it, [field]: val } : it) } : sec))
  }
  function removeItem(si, ii) {
    setSections(s => s.map((sec, idx) => idx === si ? { ...sec, items: sec.items.filter((_, iidx) => iidx !== ii) } : sec))
  }
  function removeSection(si) {
    setSections(s => s.filter((_, idx) => idx !== si))
  }
  function updateHour(i, field, val) {
    setHours(h => h.map((row, idx) => idx === i ? { ...row, [field]: val } : row))
  }

  function slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function handleCreate() {
    setSaving(true)
    try {
      const slug = slugify(info.name)

      // 1. Create restaurant
      const { data: rest, error } = await supabase
        .from('restaurants')
        .insert({ name: info.name, slug, description: info.description, tagline: info.tagline })
        .select().single()
      if (error) throw error
      setRestaurantId(rest.id)

      // 2. Create menu sections + items
      for (let si = 0; si < sections.length; si++) {
        const sec = sections[si]
        if (!sec.name) continue
        const { data: sData } = await supabase.from('menu_sections')
          .insert({ restaurant_id: rest.id, name: sec.name, sort_order: si }).select().single()
        if (sData) {
          const validItems = sec.items.filter(i => i.name)
          for (let ii = 0; ii < validItems.length; ii++) {
            const item = validItems[ii]
            await supabase.from('menu_items').insert({
              restaurant_id: rest.id, section_id: sData.id,
              name: item.name, price: parseFloat(item.price) || null,
              description: item.description, available: true, sort_order: ii
            })
          }
        }
      }

      // 3. Create hours
      await supabase.from('hours').insert(hours.map(h => ({ ...h, restaurant_id: rest.id })))

      // 4. Create links
      if (links.order_url || links.reservation_url || links.phone) {
        await supabase.from('links').insert({ restaurant_id: rest.id, ...links })
      }

      const url = `https://preview.ecwebco.com/${slug}`
      setPreviewUrl(url)
      setStep(4)
      toast('Mockup created!')
    } catch (err) {
      toast(err.message || 'Failed to create mockup', 'error')
    } finally {
      setSaving(false)
    }
  }

  const timeInput = { padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontFamily: 'inherit', color: 'var(--text)', background: 'var(--bg)', width: 110 }

  return (
    <div style={{ padding: '24px 28px 32px', maxWidth: 740, margin: '0 auto' }}>
      <PageHeader title="Create Mockup" subtitle="Build a preview site to send to a prospect" />
      <StepIndicator current={step} />

      {/* STEP 0 — Restaurant Info */}
      {step === 0 && (
        <Card>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 20 }}>Restaurant details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Restaurant name">
              <input value={info.name} onChange={e => setInfo(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. La Bella Cucina" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
            <Field label="Tagline (optional)">
              <input value={info.tagline} onChange={e => setInfo(f => ({ ...f, tagline: e.target.value }))}
                placeholder="e.g. Authentic Italian since 1998" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
            <Field label="Short description (optional)">
              <textarea value={info.description} onChange={e => setInfo(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Handmade pasta and wood-fired meats in the heart of Houston..."
                style={{ ...inputStyle, height: 80, resize: 'vertical', lineHeight: 1.5 }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <Button variant="primary" onClick={() => setStep(1)} disabled={!info.name}>Next: Menu</Button>
          </div>
        </Card>
      )}

      {/* STEP 1 — Menu */}
      {step === 1 && (
        <div>
          {sections.map((sec, si) => (
            <Card key={si} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <input value={sec.name} onChange={e => updateSection(si, e.target.value)}
                  placeholder="Section name (e.g. Starters)" style={{ ...inputStyle, flex: 1, fontWeight: 500 }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                {sections.length > 1 && <Button size="sm" variant="danger" onClick={() => removeSection(si)}>Remove</Button>}
              </div>
              {sec.items.map((item, ii) => (
                <div key={ii} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: 8, marginBottom: 8, alignItems: 'start' }}>
                  <input value={item.name} onChange={e => updateItem(si, ii, 'name', e.target.value)}
                    placeholder="Item name" style={{ ...inputStyle, fontSize: 13 }}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  <input value={item.price} onChange={e => updateItem(si, ii, 'price', e.target.value)}
                    placeholder="Price" style={{ ...inputStyle, fontSize: 13 }}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  <input value={item.description} onChange={e => updateItem(si, ii, 'description', e.target.value)}
                    placeholder="Description (optional)" style={{ ...inputStyle, fontSize: 13 }}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  <button onClick={() => removeItem(si, ii)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 18, padding: '8px 4px' }}>✕</button>
                </div>
              ))}
              <button onClick={() => addItem(si)} style={{ background: 'none', border: 'none', color: 'var(--gold-dark)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', marginTop: 4 }}>
                + Add item
              </button>
            </Card>
          ))}
          <button onClick={addSection} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', background: 'var(--surface)', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, fontFamily: 'inherit', width: '100%', marginBottom: 24 }}>
            + Add section
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
            <Button variant="primary" onClick={() => setStep(2)}>Next: Hours</Button>
          </div>
        </div>
      )}

      {/* STEP 2 — Hours */}
      {step === 2 && (
        <Card>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 20 }}>Opening hours</div>
          {hours.map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < 6 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 100, fontSize: 13, fontWeight: 500 }}>{DAYS[i]}</div>
              {row.closed ? (
                <span style={{ fontSize: 12, padding: '3px 10px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 20 }}>Closed</span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <input type="time" value={row.open_time} onChange={e => updateHour(i, 'open_time', e.target.value)} style={timeInput} />
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>to</span>
                  <input type="time" value={row.close_time} onChange={e => updateHour(i, 'close_time', e.target.value)} style={timeInput} />
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--muted)', marginLeft: 'auto' }}>
                <input type="checkbox" checked={!row.closed} onChange={e => updateHour(i, 'closed', !e.target.checked)} />
                Open
              </label>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button variant="primary" onClick={() => setStep(3)}>Next: Links</Button>
          </div>
        </Card>
      )}

      {/* STEP 3 — Links */}
      {step === 3 && (
        <Card>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 20 }}>Contact & links</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Phone number">
              <input type="tel" value={links.phone} onChange={e => setLinks(l => ({ ...l, phone: e.target.value }))}
                placeholder="(713) 555-0100" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
            <Field label="Order online URL (optional)">
              <input type="url" value={links.order_url} onChange={e => setLinks(l => ({ ...l, order_url: e.target.value }))}
                placeholder="https://order.restaurant.com" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
            <Field label="Reservation URL (optional)">
              <input type="url" value={links.reservation_url} onChange={e => setLinks(l => ({ ...l, reservation_url: e.target.value }))}
                placeholder="https://resy.com/restaurant" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
            <Button variant="primary" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating mockup...' : 'Create Mockup'}
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4 — Preview */}
      {step === 4 && (
        <Card style={{ textAlign: 'center', padding: '40px 32px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Mockup ready!</h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.6 }}>
            Share this link with your prospect. Once they sign up, convert them to a full client from the Admin panel.
          </p>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 14, color: 'var(--gold-dark)', fontWeight: 500 }}>{previewUrl}</span>
            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(previewUrl); toast('Copied!') }}>Copy</Button>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Button variant="primary" onClick={() => window.open(previewUrl, '_blank')}>Open Preview</Button>
            <Button variant="ghost" onClick={() => { setStep(0); setInfo({ name: '', tagline: '', description: '' }); setSections([{ name: 'Starters', items: [{ name: '', price: '', description: '' }] }]); setLinks({ order_url: '', reservation_url: '', phone: '' }) }}>
              Create Another
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
