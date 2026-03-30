import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader, Button, Field, inputStyle, toast, Card } from '../ui'

const STEPS = ['Info', 'Menu', 'Hours', 'Links & Media', 'Preview']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const COLOR_PALETTES = [
  { id: 'moody', label: 'Moody & Dark', preview: ['#0D0D0D', '#C9A84C', '#F7F4EF'] },
  { id: 'warm', label: 'Warm & Earthy', preview: ['#3D2B1F', '#B8962E', '#F2EDE4'] },
  { id: 'fresh', label: 'Fresh & Light', preview: ['#1A3A2A', '#4A9B6F', '#F5F9F6'] },
  { id: 'bold', label: 'Bold & Modern', preview: ['#1A1A2E', '#E94560', '#F5F5F5'] },
  { id: 'classic', label: 'Classic & Elegant', preview: ['#2C2C2C', '#8B7355', '#FAF8F5'] },
]

function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600,
              background: i <= current ? 'var(--gold)' : 'var(--bg)',
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
  const [menuText, setMenuText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [showPasteBox, setShowPasteBox] = useState(false)

  const [info, setInfo] = useState({
    name: '', tagline: '', description: '',
    email: '', address: '', city: 'Houston, Texas', est: '',
    logo_url: '', palette: 'moody'
  })
  const [sections, setSections] = useState([{ name: '', items: [{ name: '', price: '', description: '' }] }])
  const [hours, setHours] = useState(DAYS.map((_, i) => ({ day_of_week: i, open_time: '11:00', close_time: '21:00', closed: i === 1 })))
  const [links, setLinks] = useState({ order_url: '', reservation_url: '', phone: '' })
  const [photoUrls, setPhotoUrls] = useState(['', '', ''])
  const [locationCount, setLocationCount] = useState(1)
  const [locations, setLocations] = useState([
    { name: '', address: '', city: 'Houston, Texas', phone: '', open_time: '11:00', close_time: '21:00' },
    { name: '', address: '', city: 'Houston, Texas', phone: '', open_time: '11:00', close_time: '21:00' },
    { name: '', address: '', city: 'Houston, Texas', phone: '', open_time: '11:00', close_time: '21:00' },
  ])

  async function parseMenu() {
    if (!menuText.trim()) return
    setParsing(true)
    try {
      const res = await fetch('/api/parse-menu', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuText })
      })
      const data = await res.json()
      if (data.sections) { setSections(data.sections); setShowPasteBox(false); setMenuText(''); toast('Menu parsed!') }
      else throw new Error('Invalid response')
    } catch { toast('Failed to parse. Try again or enter manually.', 'error') }
    finally { setParsing(false) }
  }

  function addSection() { setSections(s => [...s, { name: '', items: [{ name: '', price: '', description: '' }] }]) }
  function updateSection(i, v) { setSections(s => s.map((sec, idx) => idx === i ? { ...sec, name: v } : sec)) }
  function addItem(si) { setSections(s => s.map((sec, idx) => idx === si ? { ...sec, items: [...sec.items, { name: '', price: '', description: '' }] } : sec)) }
  function updateItem(si, ii, f, v) { setSections(s => s.map((sec, idx) => idx === si ? { ...sec, items: sec.items.map((it, iidx) => iidx === ii ? { ...it, [f]: v } : it) } : sec)) }
  function removeItem(si, ii) { setSections(s => s.map((sec, idx) => idx === si ? { ...sec, items: sec.items.filter((_, iidx) => iidx !== ii) } : sec)) }
  function removeSection(si) { setSections(s => s.filter((_, idx) => idx !== si)) }
  function updateHour(i, f, v) { setHours(h => h.map((row, idx) => idx === i ? { ...row, [f]: v } : row)) }
  function updatePhotoUrl(i, v) { setPhotoUrls(p => p.map((u, idx) => idx === i ? v : u)) }
  function slugify(n) { return n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

  async function handleCreate() {
    setSaving(true)
    try {
      const slug = slugify(info.name)
      const { data: rest, error } = await supabase.from('restaurants')
        .insert({ name: info.name, slug, description: info.description, tagline: info.tagline, email: info.email, address: info.address, city: info.city, est: info.est ? parseInt(info.est) : null, logo_url: info.logo_url || null, palette: info.palette })
        .select().single()
      if (error) throw error

      for (let si = 0; si < sections.length; si++) {
        const sec = sections[si]
        if (!sec.name) continue
        const { data: sData } = await supabase.from('menu_sections')
          .insert({ restaurant_id: rest.id, name: sec.name, sort_order: si }).select().single()
        if (sData) {
          const validItems = sec.items.filter(i => i.name)
          for (let ii = 0; ii < validItems.length; ii++) {
            await supabase.from('menu_items').insert({
              restaurant_id: rest.id, section_id: sData.id,
              name: validItems[ii].name, price: parseFloat(validItems[ii].price) || null,
              description: validItems[ii].description, available: true, sort_order: ii
            })
          }
        }
      }

      await supabase.from('hours').insert(hours.map(h => ({ ...h, restaurant_id: rest.id })))

      // Save locations to new locations table
      if (locationCount > 1) {
        for (let li = 0; li < locationCount; li++) {
          const loc = locations[li]
          const { data: locData } = await supabase.from('locations')
            .insert({ restaurant_id: rest.id, name: loc.name || `Location ${li + 1}`, address: loc.address, sort_order: li })
            .select().single()
          if (locData) {
            await supabase.from('location_hours').insert(
              ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((_, di) => ({
                location_id: locData.id, day_of_week: di,
                open_time: loc.open_time || '11:00', close_time: loc.close_time || '21:00',
                closed: di === 1
              }))
            )
            if (loc.phone) {
              await supabase.from('location_links').insert({ location_id: locData.id, phone: loc.phone })
            }
          }
        }
      }

      if (links.order_url || links.reservation_url || links.phone) {
        const { error: linkError } = await supabase.from('links')
          .upsert({ restaurant_id: rest.id, order_url: links.order_url || null, reservation_url: links.reservation_url || null, phone: links.phone || null })
        if (linkError) console.error('Links error:', linkError)
      }

      const validPhotos = photoUrls.filter(u => u.trim())
      for (let pi = 0; pi < validPhotos.length; pi++) {
        await supabase.from('photos').insert({ restaurant_id: rest.id, storage_path: validPhotos[pi], url: validPhotos[pi], is_hero: pi === 0, sort_order: pi })
      }

      setPreviewUrl(`https://preview.ecwebco.com/${slug}`)
      setStep(4)
      toast('Mockup created!')
    } catch (err) {
      toast(err.message || 'Failed to create mockup', 'error')
    } finally { setSaving(false) }
  }

  const ti = { padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontFamily: 'inherit', color: 'var(--text)', background: 'var(--bg)', width: 110 }

  return (
    <div style={{ padding: '24px 28px 32px', maxWidth: 760, margin: '0 auto' }}>
      <PageHeader title="Create Mockup" subtitle="Build a preview site to send to a prospect" />
      <StepIndicator current={step} />

      {/* STEP 0 — Info */}
      {step === 0 && (
        <Card>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 20 }}>Restaurant details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Restaurant name *">
              <input value={info.name} onChange={e => setInfo(f => ({ ...f, name: e.target.value }))} placeholder="e.g. La Bella Cucina" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
            <Field label="Tagline">
              <input value={info.tagline} onChange={e => setInfo(f => ({ ...f, tagline: e.target.value }))} placeholder="e.g. Authentic Italian since 1998" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
            <Field label="Description">
              <textarea value={info.description} onChange={e => setInfo(f => ({ ...f, description: e.target.value }))} placeholder="A brief description shown on the website..." style={{ ...inputStyle, height: 80, resize: 'vertical', lineHeight: 1.5 }} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Email">
                <input type="email" value={info.email} onChange={e => setInfo(f => ({ ...f, email: e.target.value }))} placeholder="hello@restaurant.com" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </Field>
              <Field label="Year established">
                <input type="number" value={info.est} onChange={e => setInfo(f => ({ ...f, est: e.target.value }))} placeholder="e.g. 2018" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </Field>
            </div>
            <Field label="Address">
              <input value={info.address} onChange={e => setInfo(f => ({ ...f, address: e.target.value }))} placeholder="e.g. 1234 Westheimer Rd, Houston TX 77006" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
            <Field label="City">
              <input value={info.city} onChange={e => setInfo(f => ({ ...f, city: e.target.value }))} placeholder="e.g. Houston, Texas" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
            <Field label="Number of locations">
              <div style={{ display: 'flex', gap: 8 }}>
                {[1,2,3].map(n => (
                  <button key={n} type="button" onClick={() => setLocationCount(n)} style={{
                    padding: '8px 20px', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit', transition: '0.15s', border: 'none',
                    background: locationCount === n ? 'var(--gold)' : 'var(--bg)',
                    color: locationCount === n ? '#fff' : 'var(--muted)',
                    outline: locationCount === n ? 'none' : '1px solid var(--border)'
                  }}>{n}</button>
                ))}
              </div>
            </Field>
            <Field label="Logo URL (optional — paste a URL to their logo image)">
              <input value={info.logo_url} onChange={e => setInfo(f => ({ ...f, logo_url: e.target.value }))} placeholder="https://..." style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              {info.logo_url && <img src={info.logo_url} alt="logo preview" style={{ height: 40, marginTop: 8, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />}
            </Field>
            <Field label="Color palette">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 4 }}>
                {COLOR_PALETTES.map(p => (
                  <div key={p.id} onClick={() => setInfo(f => ({ ...f, palette: p.id }))} style={{ cursor: 'pointer', border: info.palette === p.id ? '2px solid var(--gold)' : '1px solid var(--border)', borderRadius: 8, padding: '10px 8px', textAlign: 'center', transition: '0.15s' }}>
                    <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 6 }}>
                      {p.preview.map((c, i) => <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: c, border: '1px solid rgba(0,0,0,0.1)' }} />)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.3 }}>{p.label}</div>
                  </div>
                ))}
              </div>
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
          <Card style={{ marginBottom: 16, background: 'var(--gold-light)', border: '1px solid #E8D49A' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showPasteBox ? 12 : 0 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--gold-dark)' }}>✦ AI Menu Import</div>
                <div style={{ fontSize: 12, color: 'var(--gold-dark)', opacity: 0.8, marginTop: 2 }}>Paste their menu text and AI structures it automatically</div>
              </div>
              <Button size="sm" variant="primary" onClick={() => setShowPasteBox(!showPasteBox)}>{showPasteBox ? 'Cancel' : 'Paste Menu'}</Button>
            </div>
            {showPasteBox && (
              <div style={{ marginTop: 12 }}>
                <textarea value={menuText} onChange={e => setMenuText(e.target.value)} placeholder="Paste menu text here — from their website, a photo, Google listing, anything..." style={{ ...inputStyle, height: 160, resize: 'vertical', lineHeight: 1.5, background: '#fff' }} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <Button variant="primary" onClick={parseMenu} disabled={!menuText.trim() || parsing}>{parsing ? 'Parsing...' : '✦ Parse with AI'}</Button>
                </div>
              </div>
            )}
          </Card>
          {sections.map((sec, si) => (
            <Card key={si} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <input value={sec.name} onChange={e => updateSection(si, e.target.value)} placeholder="Section name (e.g. Starters)" style={{ ...inputStyle, flex: 1, fontWeight: 500 }} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                {sections.length > 1 && <Button size="sm" variant="danger" onClick={() => removeSection(si)}>Remove</Button>}
              </div>
              {sec.items.map((item, ii) => (
                <div key={ii} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: 8, marginBottom: 8 }}>
                  <input value={item.name} onChange={e => updateItem(si, ii, 'name', e.target.value)} placeholder="Item name" style={{ ...inputStyle, fontSize: 13 }} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  <input value={item.price} onChange={e => updateItem(si, ii, 'price', e.target.value)} placeholder="Price" style={{ ...inputStyle, fontSize: 13 }} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  <input value={item.description} onChange={e => updateItem(si, ii, 'description', e.target.value)} placeholder="Description (optional)" style={{ ...inputStyle, fontSize: 13 }} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  <button onClick={() => removeItem(si, ii)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 18, padding: '8px 4px' }}>✕</button>
                </div>
              ))}
              <button onClick={() => addItem(si)} style={{ background: 'none', border: 'none', color: 'var(--gold-dark)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', marginTop: 4 }}>+ Add item</button>
            </Card>
          ))}
          <button onClick={addSection} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', background: 'var(--surface)', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, fontFamily: 'inherit', width: '100%', marginBottom: 24 }}>+ Add section</button>
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
              {row.closed ? <span style={{ fontSize: 12, padding: '3px 10px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 20 }}>Closed</span> : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <input type="time" value={row.open_time} onChange={e => updateHour(i, 'open_time', e.target.value)} style={ti} />
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>to</span>
                  <input type="time" value={row.close_time} onChange={e => updateHour(i, 'close_time', e.target.value)} style={ti} />
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
            <Button variant="primary" onClick={() => setStep(3)}>Next: Links & Media</Button>
          </div>
        </Card>
      )}

      {/* STEP 2.5 — Locations (only if multiple) */}
      {step === 25 && (
        <div>
          {Array.from({length: locationCount}).map((_, li) => (
            <Card key={li} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16, color: 'var(--text)' }}>Location {li + 1}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label='Location name (optional)'>
                  <input value={locations[li].name} onChange={e => setLocations(l => l.map((loc, idx) => idx === li ? {...loc, name: e.target.value} : loc))}
                    placeholder={} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </Field>
                <Field label='Address'>
                  <input value={locations[li].address} onChange={e => setLocations(l => l.map((loc, idx) => idx === li ? {...loc, address: e.target.value} : loc))}
                    placeholder='e.g. 1234 Westheimer Rd, Houston TX 77006' style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </Field>
                <Field label='Phone number'>
                  <input type='tel' value={locations[li].phone} onChange={e => setLocations(l => l.map((loc, idx) => idx === li ? {...loc, phone: e.target.value} : loc))}
                    placeholder='(713) 555-0100' style={{...inputStyle, width: 200}}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </Field>
                <Field label='Hours'>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type='time' value={locations[li].open_time} onChange={e => setLocations(l => l.map((loc, idx) => idx === li ? {...loc, open_time: e.target.value} : loc))} style={{padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontFamily: 'inherit', background: 'var(--bg)', width: 110}} />
                    <span style={{fontSize: 12, color: 'var(--muted)'}}>to</span>
                    <input type='time' value={locations[li].close_time} onChange={e => setLocations(l => l.map((loc, idx) => idx === li ? {...loc, close_time: e.target.value} : loc))} style={{padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontFamily: 'inherit', background: 'var(--bg)', width: 110}} />
                  </div>
                </Field>
              </div>
            </Card>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant='ghost' onClick={() => setStep(2)}>Back</Button>
            <Button variant='primary' onClick={() => setStep(3)}>Next: Links & Media</Button>
          </div>
        </div>
      )}

      {/* STEP 2.5 — Locations */}
      {step === 25 && (
        <div>
          {Array.from({length: locationCount}).map((_, li) => (
            <Card key={li} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Location {li + 1}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Location name (optional)">
                  <input value={locations[li].name} onChange={e => setLocations(l => l.map((loc, idx) => idx === li ? {...loc, name: e.target.value} : loc))}
                    placeholder={`e.g. ${info.name} — Montrose`} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </Field>
                <Field label="Address">
                  <input value={locations[li].address} onChange={e => setLocations(l => l.map((loc, idx) => idx === li ? {...loc, address: e.target.value} : loc))}
                    placeholder="e.g. 1234 Westheimer Rd, Houston TX 77006" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </Field>
                <Field label="Phone number">
                  <input type="tel" value={locations[li].phone} onChange={e => setLocations(l => l.map((loc, idx) => idx === li ? {...loc, phone: e.target.value} : loc))}
                    placeholder="(713) 555-0100" style={{...inputStyle, width: 200}}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </Field>
                <Field label="Hours">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="time" value={locations[li].open_time}
                      onChange={e => setLocations(l => l.map((loc, idx) => idx === li ? {...loc, open_time: e.target.value} : loc))}
                      style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontFamily: 'inherit', background: 'var(--bg)', width: 110 }} />
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>to</span>
                    <input type="time" value={locations[li].close_time}
                      onChange={e => setLocations(l => l.map((loc, idx) => idx === li ? {...loc, close_time: e.target.value} : loc))}
                      style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontFamily: 'inherit', background: 'var(--bg)', width: 110 }} />
                  </div>
                </Field>
              </div>
            </Card>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
            <Button variant="primary" onClick={() => setStep(3)}>Next: Links & Media</Button>
          </div>
        </div>
      )}

      {/* STEP 3 — Links & Media */}
      {step === 3 && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 20 }}>Contact & links</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Phone number">
                <input type="tel" value={links.phone} onChange={e => setLinks(l => ({ ...l, phone: e.target.value }))} placeholder="(713) 555-0100" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </Field>
              <Field label="Order online URL">
                <input type="url" value={links.order_url} onChange={e => setLinks(l => ({ ...l, order_url: e.target.value }))} placeholder="https://order.restaurant.com" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </Field>
              <Field label="Reservation URL">
                <input type="url" value={links.reservation_url} onChange={e => setLinks(l => ({ ...l, reservation_url: e.target.value }))} placeholder="https://resy.com/restaurant" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </Field>
            </div>
          </Card>
          <Card style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Photos</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Paste image URLs. The first photo will be the hero image shown at the top of the site.</div>
            {photoUrls.map((url, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {url ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} /> : <span style={{ fontSize: 18, color: 'var(--subtle)' }}>{i + 1}</span>}
                </div>
                <input value={url} onChange={e => updatePhotoUrl(i, e.target.value)} placeholder={i === 0 ? 'Hero image URL (shown at top of site)' : `Photo ${i + 1} URL`} style={{ ...inputStyle, flex: 1, fontSize: 13 }} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
            ))}
            <button onClick={() => setPhotoUrls(p => [...p, ''])} style={{ background: 'none', border: 'none', color: 'var(--gold-dark)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', marginTop: 4 }}>+ Add another photo</button>
          </Card>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
            <Button variant="primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : '✦ Create Mockup'}</Button>
          </div>
        </div>
      )}

      {/* STEP 4 — Preview */}
      {step === 4 && (
        <Card style={{ textAlign: 'center', padding: '40px 32px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Mockup ready!</h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.6 }}>Share this link with your prospect. Once they sign up, convert them to a full client from the Admin panel.</p>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 14, color: 'var(--gold-dark)', fontWeight: 500 }}>{previewUrl}</span>
            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(previewUrl); toast('Copied!') }}>Copy</Button>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Button variant="primary" onClick={() => window.open(previewUrl, '_blank')}>Open Preview</Button>
            <Button variant="ghost" onClick={() => { setStep(0); setInfo({ name: '', tagline: '', description: '', email: '', address: '', city: 'Houston, Texas', est: '', logo_url: '', palette: 'moody' }); setSections([{ name: '', items: [{ name: '', price: '', description: '' }] }]); setLinks({ order_url: '', reservation_url: '', phone: '' }); setPhotoUrls(['', '', '']) }}>Create Another</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
