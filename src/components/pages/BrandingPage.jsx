import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { PageHeader, Button, Field, inputStyle, Toggle, Spinner, Card, toast } from '../ui'

const ADMIN_EMAIL = 'evan@ecwebco.com'

export default function BrandingPage() {
  const { restaurant, session } = useAuth()
  const isAdmin = session?.user?.email === ADMIN_EMAIL

  const [tab, setTab] = useState('brand')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  // Build tab list — admin sees all, restaurants see a subset
  const TABS = [
    { key: 'brand',          label: 'Brand' },
    { key: 'logo',           label: 'Logo' },
    { key: 'hero',           label: 'Hero Photos' },
    { key: 'collages',       label: 'Photo Collages' },
    isAdmin && { key: 'menu_links',     label: 'Menu Links' },
    isAdmin && { key: 'private_events', label: 'Private Events' },
    { key: 'announcement',   label: 'Announcement' },
    { key: 'social',         label: 'Social Media' },
    isAdmin && { key: 'seo',            label: 'SEO' },
    isAdmin && { key: 'domain',         label: 'Domain' },
  ].filter(Boolean)

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

      {tab === 'brand'          && <BrandSection restaurant={restaurant} isAdmin={isAdmin} />}
      {tab === 'logo'           && <LogoSection restaurant={restaurant} />}
      {tab === 'hero'           && <HeroSection restaurant={restaurant} photos={data.photos} reload={load} />}
      {tab === 'collages'       && <CollagesSection restaurant={restaurant} photos={data.photos} reload={load} />}
      {tab === 'menu_links'     && isAdmin && <MenuLinksSection restaurant={restaurant} menuSections={data.menuSections} />}
      {tab === 'private_events' && isAdmin && <PrivateEventsSection restaurant={restaurant} />}
      {tab === 'announcement'   && <AnnouncementSection restaurant={restaurant} />}
      {tab === 'social'         && <SocialSection restaurant={restaurant} />}
      {tab === 'seo'            && isAdmin && <SEOSection restaurant={restaurant} />}
      {tab === 'domain'         && isAdmin && <DomainSection restaurant={restaurant} />}
    </div>
  )
}

/* ─── DropZone ──────────────────────────────────────────────── */
function DropZone({ onFiles, multiple = true, disabled = false, children, height = 'auto' }) {
  const fileRef = useRef()
  const [dragging, setDragging] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length === 0) {
      toast('Only image files allowed', 'error')
      return
    }
    onFiles(multiple ? files : [files[0]])
  }
  function handleDragOver(e) { e.preventDefault(); if (!disabled) setDragging(true) }
  function handleDragLeave(e) { if (e.currentTarget.contains(e.relatedTarget)) return; setDragging(false) }
  function handleClick() { if (!disabled) fileRef.current?.click() }
  function handleFileSelect(e) {
    const files = Array.from(e.target.files)
    if (files.length) onFiles(files)
    e.target.value = ''
  }

  return (
    <>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `2px dashed ${dragging ? 'var(--gold)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '32px 20px', textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: dragging ? 'var(--gold-light)' : 'transparent',
          transition: 'all 0.15s', opacity: disabled ? 0.5 : 1, height,
        }}
      >
        {children}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple={multiple} style={{ display: 'none' }} onChange={handleFileSelect} />
    </>
  )
}

/* ─── Admin-only section wrapper ────────────────────────────── */
function AdminBadge() {
  return (
    <span style={{
      display: 'inline-block', marginLeft: 8, padding: '2px 8px',
      background: 'var(--gold)', color: '#fff', borderRadius: 999,
      fontSize: 9, fontWeight: 700, letterSpacing: '1px',
      textTransform: 'uppercase', verticalAlign: 'middle',
    }}>
      Admin Only
    </span>
  )
}

/* ─── Brand info ────────────────────────────────────────────── */
function BrandSection({ restaurant, isAdmin }) {
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
      const updates = {
        name: form.name,
        about: form.about,
        description: form.about,
        email: form.email,
        events_email: form.events_email || null,
        city: form.city,
      }
      // Admin-only fields — only update if admin
      if (isAdmin) {
        updates.tagline = form.tagline
        updates.color_ink = form.color_ink || null
        updates.color_gold = form.color_gold || null
        updates.color_off = form.color_off || null
      }

      const { error } = await supabase
        .from('restaurants')
        .update(updates)
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

          {isAdmin && (
            <Field label={<>Tagline <AdminBadge /></>}>
              <input value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="A short phrase that describes your place" style={inputStyle} {...focusStyle} />
            </Field>
          )}

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
              If set, a "Private Events" section appears on your homepage.
            </p>
          </Field>
        </div>
      </Card>

      {isAdmin && (
        <Card style={{ marginBottom: 24 }}>
          <SectionHeader title={<>Brand Colors <AdminBadge /></>} subtitle="Pick three colors used across the website" />
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
      )}

      <SaveBar onSave={save} saving={saving} />
    </>
  )
}

/* ─── Logo section ──────────────────────────────────────────── */
function LogoSection({ restaurant }) {
  const [form, setForm] = useState({ logo_url: '', logo_light_url: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(null)

  useEffect(() => {
    setForm({ logo_url: restaurant.logo_url || '', logo_light_url: restaurant.logo_light_url || '' })
  }, [restaurant.id])

  async function uploadLogo(file, field) {
    if (!file) return
    setUploading(field)
    const path = `${restaurant.id}/${field}-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('restaurant-photos').upload(path, file, { upsert: true })
    if (error) { toast('Failed to upload', 'error'); setUploading(null); return }
    const { data } = supabase.storage.from('restaurant-photos').getPublicUrl(path)
    setForm(f => ({ ...f, [field]: data.publicUrl }))
    setUploading(null)
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
          <DropZone onFiles={files => uploadLogo(files[0], field)} multiple={false} disabled={uploading === field}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
              {uploading === field ? 'Uploading…' : (form[field] ? 'Drop a new logo here or click to replace' : 'Drop logo here or click to upload')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>PNG with transparent background works best</div>
          </DropZone>
          {form[field] && (
            <button onClick={() => setForm(f => ({ ...f, [field]: '' }))} style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: 0 }}>
              Remove logo
            </button>
          )}
        </div>
      </div>
    </Card>
  )

  return (
    <>
      <LogoUploader field="logo_url" label="Primary Logo" hint="Shown in the navigation bar and footer." />
      <LogoUploader field="logo_light_url" label="Light Logo (optional)" hint="Shown over your hero photos." dark />
      <SaveBar onSave={save} saving={saving} />
    </>
  )
}

/* ─── Hero section ──────────────────────────────────────────── */
function HeroSection({ restaurant, photos, reload }) {
  const heroPhotos = photos.filter(p => p.section === 'hero' || (p.is_hero && !p.section)).sort((a, b) => a.sort_order - b.sort_order)
  const [uploading, setUploading] = useState(false)

  async function handleUpload(files) {
    if (!files?.length) return
    setUploading(true)
    const startIdx = heroPhotos.length
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const path = `${restaurant.id}/hero-${Date.now()}-${i}-${file.name.replace(/\s/g, '-')}`
      const { error: upErr } = await supabase.storage.from('restaurant-photos').upload(path, file)
      if (upErr) continue
      const { data: urlData } = supabase.storage.from('restaurant-photos').getPublicUrl(path)
      await supabase.from('photos').insert({
        restaurant_id: restaurant.id, storage_path: path, url: urlData.publicUrl,
        is_hero: true, section: 'hero', sort_order: startIdx + i,
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
      <SectionHeader title="Hero Slideshow" subtitle="The photos that rotate at the top of your homepage." />
      <div style={{ marginBottom: heroPhotos.length > 0 ? 16 : 0 }}>
        <DropZone onFiles={handleUpload} disabled={uploading}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🖼</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
            {uploading ? 'Uploading…' : 'Drop photos here or click to upload'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Drag multiple files at once, or click to browse</div>
        </DropZone>
      </div>
      {heroPhotos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
      )}
    </Card>
  )
}

/* ─── Photo Collages ────────────────────────────────────────── */
const COLLAGE_SLOTS = [
  { key: 'collage_1', title: 'Collage 1 — next to About', desc: 'Shown beside your About section.' },
  { key: 'collage_2', title: 'Collage 2 — next to Locations', desc: 'Shown beside your Locations section.' },
  { key: 'collage_3', title: 'Collage 3 — next to Menu Links', desc: 'Shown beside your Menu Links section.' },
  { key: 'collage_4', title: 'Collage 4 — next to Private Events', desc: 'Shown beside your Private Events section (only if you have an events email set).' },
]

function CollagesSection({ restaurant, photos, reload }) {
  const [uploadingSlot, setUploadingSlot] = useState(null)
  const photosBySlot = {
    collage_1: photos.filter(p => p.section === 'collage_1').sort((a, b) => a.sort_order - b.sort_order),
    collage_2: photos.filter(p => p.section === 'collage_2').sort((a, b) => a.sort_order - b.sort_order),
    collage_3: photos.filter(p => p.section === 'collage_3').sort((a, b) => a.sort_order - b.sort_order),
    collage_4: photos.filter(p => p.section === 'collage_4').sort((a, b) => a.sort_order - b.sort_order),
  }

  async function handleUpload(slotKey, files) {
    if (!files?.length) return
    setUploadingSlot(slotKey)
    const existingCount = photosBySlot[slotKey].length
    const allowed = Math.max(0, 3 - existingCount)
    const toUpload = Array.from(files).slice(0, allowed)
    if (toUpload.length < files.length) toast(`Only ${allowed} more photo${allowed === 1 ? '' : 's'} added — collages hold up to 3.`, 'error')
    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i]
      const path = `${restaurant.id}/${slotKey}-${Date.now()}-${i}-${file.name.replace(/\s/g, '-')}`
      const { error: upErr } = await supabase.storage.from('restaurant-photos').upload(path, file)
      if (upErr) continue
      const { data: urlData } = supabase.storage.from('restaurant-photos').getPublicUrl(path)
      await supabase.from('photos').insert({
        restaurant_id: restaurant.id, storage_path: path, url: urlData.publicUrl,
        section: slotKey, sort_order: existingCount + i,
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
            {!full && (
              <div style={{ marginBottom: slotPhotos.length > 0 ? 12 : 0 }}>
                <DropZone onFiles={files => handleUpload(slot.key, files)} disabled={uploadingSlot === slot.key}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>🖼</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                    {uploadingSlot === slot.key ? 'Uploading…' : `Drop photos here or click — ${3 - slotPhotos.length} slot${3 - slotPhotos.length === 1 ? '' : 's'} left`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Drag multiple files at once</div>
                </DropZone>
              </div>
            )}
            {slotPhotos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {slotPhotos.map(p => (
                  <div key={p.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => remove(p)}
                      style={{
                        position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer',
                        fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {full && <p style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', marginTop: 12 }}>Collage is full.</p>}
          </Card>
        )
      })}
    </>
  )
}

/* ─── Menu Links (admin only) ───────────────────────────────── */
function MenuLinksSection({ restaurant, menuSections }) {
  const [highlights, setHighlights] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setHighlights(Array.isArray(restaurant.menu_highlights) ? restaurant.menu_highlights : [])
  }, [restaurant.id])

  function add() { setHighlights(h => [...h, { label: '', time: '', section_name: '' }]) }
  function update(i, key, val) { setHighlights(h => h.map((it, idx) => (idx === i ? { ...it, [key]: val } : it))) }
  function remove(i) { setHighlights(h => h.filter((_, idx) => idx !== i)) }
  function moveUp(i) {
    if (i === 0) return
    setHighlights(h => { const c = [...h]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; return c })
  }

  async function save() {
    setSaving(true)
    const cleaned = highlights.filter(h => h.label?.trim())
    const { error } = await supabase.from('restaurants').update({ menu_highlights: cleaned }).eq('id', restaurant.id)
    if (error) toast(error.message, 'error')
    else toast('Menu links saved')
    setSaving(false)
  }

  const sectionNames = Array.from(new Set(menuSections.map(s => s.name).filter(Boolean)))

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title={<>Menu Links <AdminBadge /></>} subtitle="Menu highlights shown on the homepage. Each item links to a section in the menu." />
        {highlights.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
            No menu links yet. If none added, this section won't appear on the homepage.
          </p>
        )}
        {highlights.map((h, i) => (
          <div key={i} style={{ padding: '14px 0', borderBottom: i < highlights.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
              <Field label="Label">
                <input value={h.label || ''} onChange={e => update(i, 'label', e.target.value)} placeholder="e.g. Lunch" style={inputStyle} {...focusStyle} />
              </Field>
              <Field label="Time / description">
                <input value={h.time || ''} onChange={e => update(i, 'time', e.target.value)} placeholder="e.g. Tue – Fri · 11AM – 4PM" style={inputStyle} {...focusStyle} />
              </Field>
            </div>
            <Field label="Links to menu section (optional)">
              <select value={h.section_name || ''} onChange={e => update(i, 'section_name', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">— No link —</option>
                {sectionNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </Field>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <Button size="sm" variant="ghost" onClick={() => moveUp(i)} disabled={i === 0}>↑ Move up</Button>
              <Button size="sm" variant="danger" onClick={() => remove(i)}>Remove</Button>
            </div>
          </div>
        ))}
        <button onClick={add} style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
          padding: '10px 16px', background: 'var(--surface)',
          border: '2px dashed var(--border)', borderRadius: 'var(--radius)',
          cursor: 'pointer', color: 'var(--muted)', fontSize: 13, fontFamily: 'inherit', width: '100%',
        }}>
          + Add menu link
        </button>
      </Card>
      <SaveBar onSave={save} saving={saving} />
    </>
  )
}

/* ─── Private Events (admin only) ───────────────────────────── */
function PrivateEventsSection({ restaurant }) {
  const [form, setForm] = useState({ title: '', body: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({
      title: restaurant.private_events_title || '',
      body: restaurant.private_events_body || '',
    })
  }, [restaurant.id])

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from('restaurants')
      .update({
        private_events_title: form.title || null,
        private_events_body: form.body || null,
      })
      .eq('id', restaurant.id)
    if (error) toast(error.message, 'error')
    else toast('Private Events copy saved')
    setSaving(false)
  }

  const enabled = !!restaurant.events_email

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title={<>Private Events Section <AdminBadge /></>} subtitle="Shown on the homepage when an events email is set." />
        {!enabled ? (
          <p style={{ fontSize: 13, color: 'var(--warning)', lineHeight: 1.6, margin: 0 }}>
            ⚠ Section won't appear yet. Set the Events / catering inbox in Branding → Brand to enable.
          </p>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
            ✓ Section is live. Customize heading and copy below, or leave blank for defaults.
          </p>
        )}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Section title">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Private Events & Catering" style={inputStyle} {...focusStyle} />
          </Field>
          <Field label="Body copy">
            <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Office lunches, client meetings, celebrations..."
              style={{ ...inputStyle, height: 120, resize: 'vertical', lineHeight: 1.5 }} {...focusStyle} />
          </Field>
        </div>
      </Card>

      <SaveBar onSave={save} saving={saving} />
    </>
  )
}

/* ─── Announcement ──────────────────────────────────────────── */
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
        <SectionHeader title="Announcement Popup" subtitle="A popup that shows once per visitor session." />
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
        <SectionHeader title="Items" />
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

/* ─── Social Media ──────────────────────────────────────────── */
function SocialSection({ restaurant }) {
  const [form, setForm] = useState({ instagram: '', facebook: '', tiktok: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({
      instagram: restaurant.instagram || '',
      facebook: restaurant.facebook || '',
      tiktok: restaurant.tiktok || '',
    })
  }, [restaurant.id])

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from('restaurants')
      .update({
        instagram: form.instagram || null,
        facebook: form.facebook || null,
        tiktok: form.tiktok || null,
      })
      .eq('id', restaurant.id)
    if (error) toast(error.message, 'error')
    else toast('Social links saved')
    setSaving(false)
  }

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title="Social Media" subtitle="Icons appear in the footer. Paste a full URL, or just the handle (e.g. @yourname)." />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Instagram">
            <input value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} placeholder="@yourrestaurant or full URL" style={inputStyle} {...focusStyle} />
          </Field>
          <Field label="Facebook">
            <input value={form.facebook} onChange={e => setForm(f => ({ ...f, facebook: e.target.value }))} placeholder="Page name or full URL" style={inputStyle} {...focusStyle} />
          </Field>
          <Field label="TikTok (optional)">
            <input value={form.tiktok} onChange={e => setForm(f => ({ ...f, tiktok: e.target.value }))} placeholder="@yourrestaurant or full URL" style={inputStyle} {...focusStyle} />
          </Field>
        </div>
      </Card>
      <SaveBar onSave={save} saving={saving} />
    </>
  )
}

/* ─── SEO (admin only) ──────────────────────────────────────── */
function SEOSection({ restaurant }) {
  const [form, setForm] = useState({ favicon_url: '', seo_description: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setForm({
      favicon_url: restaurant.favicon_url || '',
      seo_description: restaurant.seo_description || '',
    })
  }, [restaurant.id])

  async function uploadFavicon(file) {
    if (!file) return
    setUploading(true)
    const path = `${restaurant.id}/favicon-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('restaurant-photos').upload(path, file, { upsert: true })
    if (error) { toast('Failed to upload', 'error'); setUploading(false); return }
    const { data } = supabase.storage.from('restaurant-photos').getPublicUrl(path)
    setForm(f => ({ ...f, favicon_url: data.publicUrl }))
    setUploading(false)
    toast('Favicon uploaded — remember to save')
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from('restaurants')
      .update({
        favicon_url: form.favicon_url || null,
        seo_description: form.seo_description || null,
      })
      .eq('id', restaurant.id)
    if (error) toast(error.message, 'error')
    else toast('SEO settings saved')
    setSaving(false)
  }

  const previewDescription = form.seo_description ||
    (restaurant.about
      ? (restaurant.about.length > 155 ? restaurant.about.slice(0, 155).trim() + '…' : restaurant.about)
      : `Visit ${restaurant.name || 'us'}`)

  const charCount = form.seo_description.length
  const overLimit = charCount > 160

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title={<>Favicon <AdminBadge /></>} subtitle="Square image, e.g., 256×256 PNG. Logo cropped to a square works well." />
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 96, height: 96, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {form.favicon_url ? (
              <img src={form.favicon_url} alt="favicon preview" style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: 24, color: 'var(--subtle)' }}>🌐</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <DropZone onFiles={files => uploadFavicon(files[0])} multiple={false} disabled={uploading}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                {uploading ? 'Uploading…' : (form.favicon_url ? 'Drop a new favicon or click to replace' : 'Drop favicon or click to upload')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Square PNG works best — typically 256×256 or 512×512</div>
            </DropZone>
            {form.favicon_url && (
              <button onClick={() => setForm(f => ({ ...f, favicon_url: '' }))}
                style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: 0 }}>
                Remove favicon
              </button>
            )}
            {!form.favicon_url && restaurant.logo_url && (
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
                If no favicon uploaded, the primary logo is used. (May look stretched at small sizes.)
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title={<>Meta Description <AdminBadge /></>} subtitle="The blurb shown under the link in Google search results. Around 150 characters." />
        <Field label="Description">
          <textarea
            value={form.seo_description}
            onChange={e => setForm(f => ({ ...f, seo_description: e.target.value }))}
            placeholder={restaurant.about ? '(Will use About paragraph if left blank)' : `Visit ${restaurant.name || 'this restaurant'}`}
            style={{ ...inputStyle, height: 90, resize: 'vertical', lineHeight: 1.5 }}
            {...focusStyle}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
              {form.seo_description ? '' : 'Leave blank to auto-use About paragraph (truncated to 155 chars).'}
            </p>
            <span style={{ fontSize: 11, color: overLimit ? 'var(--danger)' : 'var(--muted)' }}>
              {charCount}/160
            </span>
          </div>
        </Field>

        <div style={{ marginTop: 20, padding: 16, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 10, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Preview — How it'll look in Google
          </div>
          <div style={{ fontSize: 16, color: '#1a0dab', marginBottom: 4, fontWeight: 400 }}>
            {restaurant.tagline ? `${restaurant.name || 'Restaurant Name'} | ${restaurant.tagline}` : (restaurant.name || 'Restaurant Name')}
          </div>
          <div style={{ fontSize: 12, color: '#006621', marginBottom: 4 }}>
            {restaurant.custom_domain || 'yourdomain.com'}
          </div>
          <div style={{ fontSize: 13, color: '#545454', lineHeight: 1.5 }}>
            {previewDescription}
          </div>
        </div>
      </Card>

      <SaveBar onSave={save} saving={saving} />
    </>
  )
}

/* ─── Domain (admin only) ───────────────────────────────────── */
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
      <SectionHeader title={<>Custom Domain <AdminBadge /></>} subtitle="Connect a custom domain so customers see yourrestaurant.com." />
      <Field label="Domain">
        <input value={form.custom_domain} onChange={e => setForm({ custom_domain: e.target.value })} placeholder="yourrestaurant.com" style={inputStyle} {...focusStyle} />
      </Field>
      <div style={{ marginTop: 16 }}>
        <Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Domain'}</Button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 16, lineHeight: 1.6 }}>
        DNS setup instructions and verification status will appear here once the domain integration is wired up.
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
