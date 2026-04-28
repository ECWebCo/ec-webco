import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { PageHeader, Button, Field, inputStyle, Toggle, Spinner, Card, toast } from '../ui'

const TABS = [
  { key: 'brand',        label: 'Brand' },
  { key: 'logo',         label: 'Logo' },
  { key: 'hero',         label: 'Hero Photos' },
  { key: 'collages',     label: 'Photo Collages' },
  { key: 'menu_links',   label: 'Menu Links' },
  { key: 'announcement', label: 'Announcement' },
  { key: 'domain',       label: 'Domain' },
]

export default function BrandingPage() {
  const { restaurant } = useAuth()
  const [tab, setTab] = useState('brand')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    if (restaurant?.id) load()
  }, [restaurant?.id])

  async function load() {
    setLoading(true)
    const [photosRes, sectionsRes] = await Promise.all([
      supabase.from('photos').select('*').eq('restaurant_id', restaurant.id).order('sort_order'),
      supabase.from('menu_sections').select('id,name,location_id').eq('restaurant_id', restaurant.id).order('sort_order'),
    ])
    setData({ photos: photosRes.data || [], menuSections: sectionsRes.data || [] })
    setLoading(false)
  }

  if (loading) return <div style={{ padding: 28 }}><Spinner /></div>

  return (
    <div style={{ padding: '24px 28px 32px', maxWidth: 800 }}>
      <PageHeader title="Branding" subtitle="Customize how your restaurant looks online" />

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t.key ? 600 : 400, fontFamily: 'inherit',
              color: tab === t.key ? 'var(--gold-dark)' : 'var(--muted)',
              borderBottom: tab === t.key ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: -1, whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'brand'        && <BrandSection restaurant={restaurant} />}
      {tab === 'logo'         && <LogoSection restaurant={restaurant} />}
      {tab === 'hero'         && <HeroSection restaurant={restaurant} photos={data.photos} reload={load} />}
      {tab === 'collages'     && <CollagesSection restaurant={restaurant} photos={data.photos} reload={load} />}
      {tab === 'menu_links'   && <MenuLinksSection restaurant={restaurant} menuSections={data.menuSections} />}
      {tab === 'announcement' && <AnnouncementSection restaurant={restaurant} />}
      {tab === 'domain'       && <DomainSection restaurant={restaurant} />}
    </div>
  )
}

/* ─── Brand info ────────────────────────────────────────────── */
function BrandSection({ restaurant }) {
  const [form, setForm] = useState({
    name: '', tagline: '', about: '',
    email: '', events_email: '', city: '',
    color_ink: '', color_gold: '', color_off: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({
      name: restaurant.name || '',
      tagline: restaurant.tagline || '',
      about: restaurant.about || restaurant.description || '',
      email: restaurant.email || '',
      events_email: restaurant.events_email || '',
      city: restaurant.city || '',
      color_ink: restaurant.color_ink || '',
      color_gold: restaurant.color_gold || '',
      color_off: restaurant.color_off || '',
    })
  }, [restaurant.id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          name: form.name,
          tagline: form.tagline,
          about: form.about,
          description: form.about,
          email: form.email,
          events_email: form.events_email || null,
          city: form.city,
          color_ink: form.color_ink || null,
          color_gold: form.color_gold || null,
          color_off: form.color_off || null,
        })
        .eq('id', restaurant.id)
      if (error) throw error
      toast('Brand info saved!')
    } catch (err) {
      toast(err.message || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Card style={{ marginBottom: 20 }}>
        <SectionHeader title="Restaurant Info" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Restaurant name">
            <input value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} {...focusStyle} />
          </Field>
          <Field label="Tagline">
            <input value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="A short phrase that describes your place" style={inputStyle} {...focusStyle} />
          </Field>
          <Field label="About (shown in the homepage About section)">
            <textarea value={form.about} onChange={e => set('about', e.target.value)} placeholder="A paragraph about your restaurant"
              style={{ ...inputStyle, height: 120, resize: 'vertical', lineHeight: 1.5 }} {...focusStyle} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="City">
              <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Houston, Texas" style={inputStyle} {...focusStyle} />
            </Field>
            <Field label="General contact email">
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="hello@restaurant.com" style={inputStyle} {...focusStyle} />
            </Field>
          </div>
          <Field label="Events / catering inbox (optional)">
            <input type="email" value={form.events_email} onChange={e => set('events_email', e.target.value)} placeholder="events@restaurant.com" style={inputStyle} {...focusStyle} />
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
              If set, the contact form shows event-focused fields (date, guest count) and routes here. Otherwise it's a general "Get in Touch" form that goes to your contact email.
            </p>
          </Field>
        </div>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <SectionHeader title="Brand Colors" subtitle="Pick three colors used across your website" />
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { key: 'color_ink',  label: 'Primary (text & nav)',         dflt: '#1B2B4B' },
            { key: 'color_gold', label: 'Accent (buttons & highlights)', dflt: '#C9A84C' },
            { key: 'color_off',  label: 'Background',                   dflt: '#FAFAF8' },
          ].map(c => (
            <div key={c.key} style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 12, minWidth: 180 }}>
              <input type="color" value={form[c.key] || c.dflt} onChange={e => set(c.key, e.target.value)}
                style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--border)', cursor: 'pointer', padding: 2, background: 'none' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{form[c.key] || c.dflt}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <SaveBar onSave={save} saving={saving} />
    </>
  )
}

/* ─── Logo section ──────────────────────────────────────────── */
function LogoSection({ restaurant }) {
  const [form, setForm] = useState({ logo_url: '', logo_light_url: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({ logo_url: restaurant.logo_url || '', logo_light_url: restaurant.logo_light_url || '' })
  }, [restaurant.id])

  async function uploadLogo(file, field) {
    if (!file) return
    const path = `${restaurant.id}/${field}-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('restaurant-photos').upload(path, file, { upsert: true })
    if (error) { toast('Failed to upload', 'error'); return }
    const { data } = supabase.storage.from('restaurant-photos').getPublicUrl(path)
    setForm(f => ({ ...f, [field]: data.publicUrl }))
    toast('Logo uploaded — remember to save')
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from('restaurants')
      .update({ logo_url: form.logo_url || null, logo_light_url: form.logo_light_url || null })
      .eq('id', restaurant.id)
    if (error) toast(error.message, 'error')
    else toast('Logos saved!')
    setSaving(false)
  }

  const LogoUploader = ({ field, label, hint, dark }) => (
    <Card style={{ marginBottom: 16 }}>
      <SectionHeader title={label} subtitle={hint} />
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ width: 120, height: 120, background: dark ? '#1B2B4B' : 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
          {form[field] ? (
            <img src={form[field]} alt={label} style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }} onError={e => (e.target.style.display = 'none')} />
          ) : (
            <span style={{ fontSize: 26, color: dark ? 'rgba(255,255,255,0.3)' : 'var(--subtle)' }}>🏷</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'inline-block', padding: '9px 18px', background: 'var(--gold)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            {form[field] ? 'Replace' : 'Upload'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadLogo(e.target.files[0], field)} />
          </label>
          {form[field] && (
            <button onClick={() => setForm(f => ({ ...f, [field]: '' }))} style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
              Remove
            </button>
          )}
        </div>
      </div>
    </Card>
  )

  return (
    <>
      <LogoUploader field="logo_url" label="Primary Logo" hint="Shown in the navigation bar and footer." />
      <LogoUploader field="logo_light_url" label="Light Logo (optional)" hint="Shown over your hero photos. If left blank, we'll auto-generate one from your primary logo (works best for simple flat logos)." dark />
      <SaveBar onSave={save} saving={saving} />
    </>
  )
}

/* ─── Hero photos ───────────────────────────────────────────── */
function HeroSection({ restaurant, photos, reload }) {
  const heroPhotos = photos.filter(p => p.section === 'hero' || (p.is_hero && !p.section)).sort((a, b) => a.sort_order - b.sort_order)
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)

  async function handleUpload(files) {
    if (!files?.length) return
    setUploading(true)
    const startIdx = heroPhotos.length
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const path = `${restaurant.id}/hero-${Date.now()}-${file.name.replace(/\s/g, '-')}`
      const { error: upErr } = await supabase.storage.from('restaurant-photos').upload(path, file)
      if (upErr) continue
      const { data: urlData } = supabase.storage.from('restaurant-photos').getPublicUrl(path)
      await supabase.from('photos').insert({
        restaurant_id: restaurant.id,
        storage_path: path,
        url: urlData.publicUrl,
        is_hero: true,
        section: 'hero',
        sort_order: startIdx + i,
      })
    }
    toast('Hero photos added')
    setUploading(false)
    reload()
  }

  async function remove(photo) {
    if (!confirm('Remove this hero photo?')) return
    if (photo.storage_path) await supabase.storage.from('restaurant-photos').remove([photo.storage_path])
    await supabase.from('photos').delete().eq('id', photo.id)
    reload()
  }

  async function move(idx, dir) {
    const target = idx + dir
    if (target < 0 || target >= heroPhotos.length) return
    const a = heroPhotos[idx]
    const b = heroPhotos[target]
    await supabase.from('photos').update({ sort_order: b.sort_order }).eq('id', a.id)
    await supabase.from('photos').update({ sort_order: a.sort_order }).eq('id', b.id)
    reload()
  }

  return (
    <Card>
      <SectionHeader title="Hero Slideshow" subtitle="The photos that rotate at the top of your homepage. Order them top to bottom." />
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleUpload(e.target.files)} />

      {heroPhotos.length === 0 ? (
        <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 20px', textAlign: 'center', cursor: 'pointer' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🖼</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Add hero photos</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{uploading ? 'Uploading…' : 'Click to upload — multiple at once is fine'}</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {heroPhotos.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ width: 56, height: 56, background: 'var(--bg)', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, fontSize: 12, color: 'var(--muted)' }}>Position {i + 1}</div>
                <Button size="sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}>↑</Button>
                <Button size="sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === heroPhotos.length - 1}>↓</Button>
                <Button size="sm" variant="danger" onClick={() => remove(p)}>Remove</Button>
              </div>
            ))}
          </div>
          <Button variant="primary" onClick={() => fileRef.current?.click()}>{uploading ? 'Uploading…' : '+ Add more photos'}</Button>
        </>
      )}
    </Card>
  )
}

/* ─── Photo Collages ────────────────────────────────────────── */
const COLLAGE_SLOTS = [
  { key: 'collage_1', title: 'Collage 1 — next to About', desc: 'Shown on the right side of your About section.' },
  { key: 'collage_2', title: 'Collage 2 — next to Locations', desc: 'Shown on the left side of your Locations section.' },
  { key: 'collage_3', title: 'Collage 3 — next to Menu Links', desc: 'Shown on the left side of your Menu Links section.' },
]

function CollagesSection({ restaurant, photos, reload }) {
  const fileRefs = useRef({})
  const [uploadingSlot, setUploadingSlot] = useState(null)

  const photosBySlot = {
    collage_1: photos.filter(p => p.section === 'collage_1').sort((a, b) => a.sort_order - b.sort_order),
    collage_2: photos.filter(p => p.section === 'collage_2').sort((a, b) => a.sort_order - b.sort_order),
    collage_3: photos.filter(p => p.section === 'collage_3').sort((a, b) => a.sort_order - b.sort_order),
  }

  async function handleUpload(slotKey, files) {
    if (!files?.length) return
    setUploadingSlot(slotKey)
    const existingCount = photosBySlot[slotKey].length
    const allowed = Math.max(0, 3 - existingCount)
    const toUpload = Array.from(files).slice(0, allowed)
    if (toUpload.length < files.length) {
      toast(`Only the first ${allowed} photo(s) added — collages hold up to 3.`, 'error')
    }
    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i]
      const path = `${restaurant.id}/${slotKey}-${Date.now()}-${file.name.replace(/\s/g, '-')}`
      const { error: upErr } = await supabase.storage.from('restaurant-photos').upload(path, file)
      if (upErr) continue
      const { data: urlData } = supabase.storage.from('restaurant-photos').getPublicUrl(path)
      await supabase.from('photos').insert({
        restaurant_id: restaurant.id,
        storage_path: path,
        url: urlData.publicUrl,
        section: slotKey,
        sort_order: existingCount + i,
      })
    }
    toast('Photos added')
    setUploadingSlot(null)
    reload()
  }

  async function remove(photo) {
    if (!confirm('Remove this photo?')) return
    if (photo.storage_path) await supabase.storage.from('restaurant-photos').remove([photo.storage_path])
    await supabase.from('photos').delete().eq('id', photo.id)
    reload()
  }

  return (
    <>
      {COLLAGE_SLOTS.map(slot => {
        const slotPhotos = photosBySlot[slot.key]
        const full = slotPhotos.length >= 3
        return (
          <Card key={slot.key} style={{ marginBottom: 16 }}>
            <SectionHeader title={slot.title} subtitle={slot.desc} />
            <input
              ref={el => (fileRefs.current[slot.key] = el)}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={e => handleUpload(slot.key, e.target.files)}
            />
            {slotPhotos.length === 0 ? (
              <div
                onClick={() => fileRefs.current[slot.key]?.click()}
                style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '36px 20px', textAlign: 'center', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 24, marginBottom: 6 }}>🖼</div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Add up to 3 photos for this collage</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{uploadingSlot === slot.key ? 'Uploading…' : 'Click to upload'}</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                  {slotPhotos.map(p => (
                    <div key={p.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        onClick={() => remove(p)}
                        style={{
                          position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%',
                          background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer',
                          fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {!full && (
                  <Button variant="ghost" size="sm" onClick={() => fileRefs.current[slot.key]?.click()}>
                    {uploadingSlot === slot.key ? 'Uploading…' : `+ Add photo (${3 - slotPhotos.length} slot${3 - slotPhotos.length === 1 ? '' : 's'} left)`}
                  </Button>
                )}
                {full && (
                  <p style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
                    Collage is full. Remove a photo above to add a different one.
                  </p>
                )}
              </>
            )}
          </Card>
        )
      })}
    </>
  )
}

/* ─── Menu Links section editor ─────────────────────────────── */
function MenuLinksSection({ restaurant, menuSections }) {
  const [highlights, setHighlights] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setHighlights(Array.isArray(restaurant.menu_highlights) ? restaurant.menu_highlights : [])
  }, [restaurant.id])

  function add() {
    setHighlights(h => [...h, { label: '', time: '', section_name: '' }])
  }
  function update(i, key, val) {
    setHighlights(h => h.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)))
  }
  function remove(i) {
    setHighlights(h => h.filter((_, idx) => idx !== i))
  }
  function moveUp(i) {
    if (i === 0) return
    setHighlights(h => {
      const copy = [...h]
      ;[copy[i - 1], copy[i]] = [copy[i], copy[i - 1]]
      return copy
    })
  }

  async function save() {
    setSaving(true)
    const cleaned = highlights.filter(h => h.label?.trim())
    const { error } = await supabase
      .from('restaurants')
      .update({ menu_highlights: cleaned })
      .eq('id', restaurant.id)
    if (error) toast(error.message, 'error')
    else toast('Menu links saved')
    setSaving(false)
  }

  // Unique section names for the dropdown
  const sectionNames = Array.from(new Set(menuSections.map(s => s.name).filter(Boolean)))

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader
          title="Menu Links"
          subtitle="A list of menu highlights (e.g. Lunch, Brunch, Happy Hour) shown on your homepage. Each item links to a section in your menu."
        />

        {highlights.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
            No menu links yet. Add one below — if you don't add any, this section won't appear on your homepage.
          </p>
        )}

        {highlights.map((h, i) => (
          <div
            key={i}
            style={{
              padding: '14px 0',
              borderBottom: i < highlights.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
              <Field label="Label">
                <input
                  value={h.label || ''}
                  onChange={e => update(i, 'label', e.target.value)}
                  placeholder="e.g. Lunch"
                  style={inputStyle}
                  {...focusStyle}
                />
              </Field>
              <Field label="Time / description">
                <input
                  value={h.time || ''}
                  onChange={e => update(i, 'time', e.target.value)}
                  placeholder="e.g. Tue – Fri · 11AM – 4PM"
                  style={inputStyle}
                  {...focusStyle}
                />
              </Field>
            </div>
            <Field label="Links to menu section (optional)">
              <select
                value={h.section_name || ''}
                onChange={e => update(i, 'section_name', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">— No link, just display the label —</option>
                {sectionNames.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
                When a customer taps this link, the menu opens to this section.
              </p>
            </Field>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <Button size="sm" variant="ghost" onClick={() => moveUp(i)} disabled={i === 0}>↑ Move up</Button>
              <Button size="sm" variant="danger" onClick={() => remove(i)}>Remove</Button>
            </div>
          </div>
        ))}

        <button
          onClick={add}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
            padding: '10px 16px', background: 'var(--surface)',
            border: '2px dashed var(--border)', borderRadius: 'var(--radius)',
            cursor: 'pointer', color: 'var(--muted)', fontSize: 13,
            fontFamily: 'inherit', width: '100%',
          }}
        >
          + Add menu link
        </button>
      </Card>

      <SaveBar onSave={save} saving={saving} />
    </>
  )
}

/* ─── Announcement editor ───────────────────────────────────── */
function AnnouncementSection({ restaurant }) {
  const [form, setForm] = useState({ enabled: false, eyebrow: '', title: '', items: [] })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({
      enabled: restaurant.announcement_enabled || false,
      eyebrow: restaurant.announcement_eyebrow || '',
      title: restaurant.announcement_title || '',
      items: Array.isArray(restaurant.announcement_items) ? restaurant.announcement_items : [],
    })
  }, [restaurant.id])

  function addItem() { setForm(f => ({ ...f, items: [...f.items, { label: '', text: '' }] })) }
  function updateItem(i, key, val) { setForm(f => ({ ...f, items: f.items.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)) })) }
  function removeItem(i) { setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) })) }

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from('restaurants')
      .update({
        announcement_enabled: form.enabled,
        announcement_eyebrow: form.eyebrow || null,
        announcement_title: form.title || null,
        announcement_items: form.items,
      })
      .eq('id', restaurant.id)
    if (error) toast(error.message, 'error')
    else toast('Announcement saved')
    setSaving(false)
  }

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title="Announcement Popup" subtitle="A popup that shows once per visitor session — great for daily specials or limited-time offers." />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <Toggle checked={form.enabled} onChange={v => setForm(f => ({ ...f, enabled: v }))} />
          <span style={{ fontSize: 13, color: 'var(--text)' }}>{form.enabled ? 'Popup is enabled' : 'Popup is disabled'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Eyebrow">
            <input value={form.eyebrow} onChange={e => setForm(f => ({ ...f, eyebrow: e.target.value }))} placeholder="e.g. Weekly Specials" style={inputStyle} {...focusStyle} />
          </Field>
          <Field label="Title">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Deals you don't want to miss" style={inputStyle} {...focusStyle} />
          </Field>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title="Items" subtitle="Each item has an optional label (e.g. day of the week) and a body. Items with a label matching today are highlighted." />
        {form.items.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>No items yet.</p>}
        {form.items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, padding: '10px 0', borderBottom: i < form.items.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
            <input value={it.label || ''} onChange={e => updateItem(i, 'label', e.target.value)} placeholder="Label" style={{ ...inputStyle, width: 140 }} {...focusStyle} />
            <input value={it.text || ''} onChange={e => updateItem(i, 'text', e.target.value)} placeholder="What's the offer?" style={inputStyle} {...focusStyle} />
            <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 18, padding: '6px 8px' }}>✕</button>
          </div>
        ))}
        <button onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 16px', background: 'var(--surface)', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, fontFamily: 'inherit', width: '100%' }}>
          + Add item
        </button>
      </Card>

      <SaveBar onSave={save} saving={saving} />
    </>
  )
}

/* ─── Domain ────────────────────────────────────────────────── */
function DomainSection({ restaurant }) {
  const [form, setForm] = useState({ custom_domain: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { setForm({ custom_domain: restaurant.custom_domain || '' }) }, [restaurant.id])

  async function save() {
    setSaving(true)
    const value = form.custom_domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
    const { error } = await supabase.from('restaurants').update({ custom_domain: value || null }).eq('id', restaurant.id)
    if (error) toast(error.message, 'error')
    else toast('Domain saved')
    setSaving(false)
  }

  return (
    <Card>
      <SectionHeader title="Custom Domain" subtitle="Connect your own domain so customers see yourrestaurant.com." />
      <Field label="Your domain">
        <input value={form.custom_domain} onChange={e => setForm({ custom_domain: e.target.value })} placeholder="yourrestaurant.com" style={inputStyle} {...focusStyle} />
      </Field>
      <div style={{ marginTop: 16 }}>
        <Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Domain'}</Button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 16, lineHeight: 1.6 }}>
        DNS setup instructions and verification status will appear here once we wire up the domain integration.
      </p>
    </Card>
  )
}

/* ─── Shared bits ───────────────────────────────────────────── */
function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{subtitle}</div>}
    </div>
  )
}

function SaveBar({ onSave, saving }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
      <Button variant="primary" size="lg" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
    </div>
  )
}

const focusStyle = {
  onFocus: e => (e.target.style.borderColor = 'var(--gold)'),
  onBlur: e => (e.target.style.borderColor = 'var(--border)'),
}
