import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { PageHeader, Button, Field, inputStyle, Toggle, Spinner, Card, toast, Modal } from '../ui'

/* ─── Tabs ──────────────────────────────────────────────────── */
const TABS = [
  { key: 'brand',        label: 'Brand' },
  { key: 'logo',         label: 'Logo' },
  { key: 'hero',         label: 'Hero Photos' },
  { key: 'buttons',      label: 'Buttons' },
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
    const [photosRes, locsRes] = await Promise.all([
      supabase.from('photos').select('*').eq('restaurant_id', restaurant.id).order('sort_order'),
      supabase
        .from('locations')
        .select('*, location_links(*)')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order'),
    ])
    setData({ photos: photosRes.data || [], locations: locsRes.data || [] })
    setLoading(false)
  }

  if (loading) return <div style={{ padding: 28 }}><Spinner /></div>

  return (
    <div style={{ padding: '24px 28px 32px', maxWidth: 800 }}>
      <PageHeader
        title="Branding"
        subtitle="Customize how your restaurant looks online"
      />

      {/* Sub-tab nav */}
      <div
        style={{
          display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)',
          overflowX: 'auto',
        }}
      >
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
      {tab === 'buttons'      && <ButtonsSection restaurant={restaurant} locations={data.locations} reload={load} />}
      {tab === 'announcement' && <AnnouncementSection restaurant={restaurant} />}
      {tab === 'domain'       && <DomainSection restaurant={restaurant} />}
    </div>
  )
}

/* ─── Brand info (name, tagline, about, contact, colors) ────── */
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
          description: form.about, // keep legacy field in sync
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
            <input
              value={form.tagline}
              onChange={e => set('tagline', e.target.value)}
              placeholder="A short phrase that describes your place"
              style={inputStyle}
              {...focusStyle}
            />
          </Field>
          <Field label="About">
            <textarea
              value={form.about}
              onChange={e => set('about', e.target.value)}
              placeholder="A paragraph about your restaurant — shown on the homepage"
              style={{ ...inputStyle, height: 120, resize: 'vertical', lineHeight: 1.5 }}
              {...focusStyle}
            />
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
            <input
              type="email"
              value={form.events_email}
              onChange={e => set('events_email', e.target.value)}
              placeholder="events@restaurant.com"
              style={inputStyle}
              {...focusStyle}
            />
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
              If set, the contact form on your site shows event-focused fields (date, guest count) and routes here. Otherwise it's a general "Get in Touch" form that goes to your contact email.
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
              <input
                type="color"
                value={form[c.key] || c.dflt}
                onChange={e => set(c.key, e.target.value)}
                style={{
                  width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--border)',
                  cursor: 'pointer', padding: 2, background: 'none',
                }}
              />
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

/* ─── Logo section (primary + light variant) ────────────────── */
function LogoSection({ restaurant }) {
  const [form, setForm] = useState({ logo_url: '', logo_light_url: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({
      logo_url: restaurant.logo_url || '',
      logo_light_url: restaurant.logo_light_url || '',
    })
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
      .update({
        logo_url: form.logo_url || null,
        logo_light_url: form.logo_light_url || null,
      })
      .eq('id', restaurant.id)
    if (error) toast(error.message, 'error')
    else toast('Logos saved!')
    setSaving(false)
  }

  const LogoUploader = ({ field, label, hint, dark }) => (
    <Card style={{ marginBottom: 16 }}>
      <SectionHeader title={label} subtitle={hint} />
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 120, height: 120,
            background: dark ? '#1B2B4B' : 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, overflow: 'hidden',
          }}
        >
          {form[field] ? (
            <img
              src={form[field]}
              alt={label}
              style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }}
              onError={e => (e.target.style.display = 'none')}
            />
          ) : (
            <span style={{ fontSize: 26, color: dark ? 'rgba(255,255,255,0.3)' : 'var(--subtle)' }}>🏷</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: 'inline-block', padding: '9px 18px',
              background: 'var(--gold)', color: '#fff',
              borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            {form[field] ? 'Replace' : 'Upload'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadLogo(e.target.files[0], field)} />
          </label>
          {form[field] && (
            <button
              onClick={() => setForm(f => ({ ...f, [field]: '' }))}
              style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </Card>
  )

  return (
    <>
      <LogoUploader
        field="logo_url"
        label="Primary Logo"
        hint="Shown in the navigation bar and footer. Use a version that reads well on a light background."
      />
      <LogoUploader
        field="logo_light_url"
        label="Light Logo (for hero overlay)"
        hint="Shown centered over your hero photos. Use a white or light-colored version of your logo."
        dark
      />
      <SaveBar onSave={save} saving={saving} />
    </>
  )
}

/* ─── Hero photos (multi-photo slideshow) ───────────────────── */
function HeroSection({ restaurant, photos, reload }) {
  const heroPhotos = photos.filter(p => p.is_hero).sort((a, b) => a.sort_order - b.sort_order)
  const otherPhotos = photos.filter(p => !p.is_hero)
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
        sort_order: startIdx + i,
      })
    }
    toast('Hero photos added')
    setUploading(false)
    reload()
  }

  async function remove(photo) {
    if (!confirm('Remove this hero photo?')) return
    if (photo.storage_path) {
      await supabase.storage.from('restaurant-photos').remove([photo.storage_path])
    }
    await supabase.from('photos').delete().eq('id', photo.id)
    reload()
  }

  async function moveUp(idx) {
    if (idx === 0) return
    const a = heroPhotos[idx - 1]
    const b = heroPhotos[idx]
    await supabase.from('photos').update({ sort_order: b.sort_order }).eq('id', a.id)
    await supabase.from('photos').update({ sort_order: a.sort_order }).eq('id', b.id)
    reload()
  }
  async function moveDown(idx) {
    if (idx === heroPhotos.length - 1) return
    return moveUp(idx + 1)
  }

  async function promoteToHero(photo) {
    const newOrder = heroPhotos.length
    await supabase.from('photos').update({ is_hero: true, sort_order: newOrder }).eq('id', photo.id)
    reload()
  }

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader
          title="Hero Slideshow"
          subtitle="The photos that rotate at the top of your homepage. The first photo is shown first."
        />

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => handleUpload(e.target.files)}
        />

        {heroPhotos.length === 0 ? (
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)',
              padding: '48px 20px', textAlign: 'center', cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>🖼</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Add hero photos</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {uploading ? 'Uploading…' : 'Click to upload — multiple at once is fine'}
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {heroPhotos.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: 8, border: '1px solid var(--border)', borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      width: 56, height: 56, background: 'var(--bg)',
                      borderRadius: 6, overflow: 'hidden', flexShrink: 0,
                    }}
                  >
                    <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, fontSize: 12, color: 'var(--muted)' }}>
                    Position {i + 1}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => moveUp(i)} disabled={i === 0}>↑</Button>
                  <Button size="sm" variant="ghost" onClick={() => moveDown(i)} disabled={i === heroPhotos.length - 1}>↓</Button>
                  <Button size="sm" variant="danger" onClick={() => remove(p)}>Remove</Button>
                </div>
              ))}
            </div>
            <Button variant="primary" onClick={() => fileRef.current?.click()}>
              {uploading ? 'Uploading…' : '+ Add more photos'}
            </Button>
          </>
        )}
      </Card>

      {otherPhotos.length > 0 && (
        <Card>
          <SectionHeader
            title="Other Uploaded Photos"
            subtitle="Photos that aren't currently in the hero slideshow."
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {otherPhotos.map(p => (
              <div key={p.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div
                  style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                    opacity: 0, transition: '0.2s',
                    display: 'flex', flexDirection: 'column', gap: 6,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                  onMouseOver={e => (e.currentTarget.style.opacity = '1')}
                  onMouseOut={e => (e.currentTarget.style.opacity = '0')}
                >
                  <button
                    onClick={() => promoteToHero(p)}
                    style={{ padding: '6px 12px', background: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}
                  >
                    Add to Hero
                  </button>
                  <button
                    onClick={() => remove(p)}
                    style={{ padding: '6px 12px', background: 'rgba(198,40,40,0.9)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}

/* ─── Buttons (per-storefront image uploads) ────────────────── */
const BUTTON_FIELDS = [
  { field: 'order_image_url',          label: 'Order Online',        linkField: 'order_url',       always: false, hint: 'Shows when this storefront has an Order URL set.' },
  { field: 'reservation_image_url',    label: 'Reserve a Table',     linkField: 'reservation_url', always: false, hint: 'Shows when this storefront has a Reservation URL set.' },
  { field: 'happy_hour_image_url',     label: 'Happy Hour',          linkField: null,              always: true,  hint: 'Shows when you have a menu section called "Happy Hour".' },
  { field: 'private_dining_image_url', label: 'Private Dining',      linkField: null,              always: true,  hint: 'Always shown if uploaded — opens your contact form.' },
  { field: 'events_image_url',         label: 'Events & Catering',   linkField: null,              always: true,  hint: 'Alternative to Private Dining if you don\'t offer that.' },
]

function ButtonsSection({ restaurant, locations, reload }) {
  const [activeLocId, setActiveLocId] = useState(locations[0]?.id || null)
  const activeLoc = locations.find(l => l.id === activeLocId) || locations[0]
  const activeLinks = activeLoc?.location_links?.[0] || {}

  if (!locations.length) {
    return (
      <Card>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
          Add a storefront first, then come back to upload button images for it.
        </p>
      </Card>
    )
  }

  async function uploadImage(field, file) {
    if (!file || !activeLoc) return
    const path = `${restaurant.id}/btn-${activeLoc.id}-${field}-${Date.now()}.${file.name.split('.').pop()}`
    const { error: upErr } = await supabase.storage.from('restaurant-photos').upload(path, file, { upsert: true })
    if (upErr) { toast('Failed to upload', 'error'); return }
    const { data: urlData } = supabase.storage.from('restaurant-photos').getPublicUrl(path)

    // Make sure a location_links row exists for this storefront
    let linkRow = activeLoc.location_links?.[0]
    if (!linkRow) {
      const { data } = await supabase
        .from('location_links')
        .insert({ location_id: activeLoc.id, [field]: urlData.publicUrl })
        .select()
        .single()
      linkRow = data
    } else {
      await supabase.from('location_links').update({ [field]: urlData.publicUrl }).eq('id', linkRow.id)
    }
    toast('Button image uploaded')
    reload()
  }

  async function clearImage(field) {
    if (!activeLoc?.location_links?.[0]) return
    await supabase.from('location_links').update({ [field]: null }).eq('id', activeLoc.location_links[0].id)
    reload()
  }

  return (
    <>
      {locations.length > 1 && (
        <Card style={{ marginBottom: 16 }}>
          <Field label="Editing buttons for storefront">
            <select
              value={activeLocId}
              onChange={e => setActiveLocId(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {locations.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
        </Card>
      )}

      <Card style={{ marginBottom: 16, background: 'var(--gold-light)', border: '1px solid #E8D49A' }}>
        <p style={{ fontSize: 13, color: 'var(--gold-dark)', lineHeight: 1.6, margin: 0 }}>
          <strong>How buttons work:</strong> Each button appears on your homepage as a large image tile.
          A tile only shows if you've uploaded an image AND the underlying link/feature is set up.
          Set order/reservation URLs in <strong>Storefronts</strong> first.
        </p>
      </Card>

      {BUTTON_FIELDS.map(({ field, label, linkField, always, hint }) => {
        const url = activeLinks[field]
        const linkValue = linkField ? activeLinks[linkField] : null
        const linkMissing = !always && !linkValue
        return (
          <Card key={field} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 120, height: 120, background: 'var(--bg)',
                  border: '1px solid var(--border)', borderRadius: 8,
                  overflow: 'hidden', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {url ? (
                  <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 26, color: 'var(--subtle)' }}>🖼</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.5 }}>{hint}</div>

                {linkMissing && (
                  <div
                    style={{
                      fontSize: 12, color: 'var(--warning)',
                      background: 'var(--warning-bg)',
                      padding: '6px 10px', borderRadius: 6, marginBottom: 10, lineHeight: 1.5,
                    }}
                  >
                    ⚠ This button won't appear until you set the {label.toLowerCase()} URL in Storefronts.
                  </div>
                )}

                <label
                  style={{
                    display: 'inline-block', padding: '7px 14px',
                    background: 'var(--gold)', color: '#fff',
                    borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  {url ? 'Replace' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => uploadImage(field, e.target.files[0])}
                  />
                </label>
                {url && (
                  <button
                    onClick={() => clearImage(field)}
                    style={{
                      marginLeft: 8, background: 'none', border: 'none',
                      color: 'var(--danger)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </>
  )
}

/* ─── Announcement popup editor ─────────────────────────────── */
function AnnouncementSection({ restaurant }) {
  const [form, setForm] = useState({
    enabled: false,
    eyebrow: '',
    title: '',
    items: [],
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({
      enabled: restaurant.announcement_enabled || false,
      eyebrow: restaurant.announcement_eyebrow || '',
      title: restaurant.announcement_title || '',
      items: Array.isArray(restaurant.announcement_items) ? restaurant.announcement_items : [],
    })
  }, [restaurant.id])

  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, { label: '', text: '' }] }))
  }
  function updateItem(i, key, val) {
    setForm(f => ({
      ...f,
      items: f.items.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)),
    }))
  }
  function removeItem(i) {
    setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  }

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
        <SectionHeader
          title="Announcement Popup"
          subtitle="A popup that shows once per visitor session — great for daily specials or limited-time offers."
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <Toggle checked={form.enabled} onChange={v => setForm(f => ({ ...f, enabled: v }))} />
          <span style={{ fontSize: 13, color: 'var(--text)' }}>
            {form.enabled ? 'Popup is enabled' : 'Popup is disabled'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Eyebrow (small label above the title)">
            <input
              value={form.eyebrow}
              onChange={e => setForm(f => ({ ...f, eyebrow: e.target.value }))}
              placeholder="e.g. Weekly Specials"
              style={inputStyle}
              {...focusStyle}
            />
          </Field>
          <Field label="Title">
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Deals you don't want to miss"
              style={inputStyle}
              {...focusStyle}
            />
          </Field>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SectionHeader
          title="Items"
          subtitle="Each item has an optional label (e.g. day of the week) and a body. Items with a day name matching today are highlighted automatically."
        />
        {form.items.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
            No items yet. Add one below.
          </p>
        )}
        {form.items.map((it, i) => (
          <div
            key={i}
            style={{
              display: 'flex', gap: 8, padding: '10px 0',
              borderBottom: i < form.items.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'flex-start',
            }}
          >
            <input
              value={it.label || ''}
              onChange={e => updateItem(i, 'label', e.target.value)}
              placeholder="Label (optional)"
              style={{ ...inputStyle, width: 140 }}
              {...focusStyle}
            />
            <input
              value={it.text || ''}
              onChange={e => updateItem(i, 'text', e.target.value)}
              placeholder="What's the offer or message?"
              style={inputStyle}
              {...focusStyle}
            />
            <button
              onClick={() => removeItem(i)}
              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 18, padding: '6px 8px' }}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={addItem}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
            padding: '10px 16px', background: 'var(--surface)',
            border: '2px dashed var(--border)', borderRadius: 'var(--radius)',
            cursor: 'pointer', color: 'var(--muted)', fontSize: 13, fontFamily: 'inherit', width: '100%',
          }}
        >
          + Add item
        </button>
      </Card>

      <SaveBar onSave={save} saving={saving} />
    </>
  )
}

/* ─── Domain (custom domain + status) ───────────────────────── */
function DomainSection({ restaurant }) {
  const [form, setForm] = useState({ custom_domain: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({ custom_domain: restaurant.custom_domain || '' })
  }, [restaurant.id])

  async function save() {
    setSaving(true)
    const value = form.custom_domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
    const { error } = await supabase
      .from('restaurants')
      .update({ custom_domain: value || null })
      .eq('id', restaurant.id)
    if (error) toast(error.message, 'error')
    else toast('Domain saved — DNS setup instructions below')
    setSaving(false)
  }

  const domain = form.custom_domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
  const verified = restaurant.domain_verified
  const emailVerified = restaurant.email_domain_verified

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader
          title="Custom Domain"
          subtitle="Connect your own domain so customers see yourrestaurant.com instead of preview.ecwebco.com."
        />
        <Field label="Your domain">
          <input
            value={form.custom_domain}
            onChange={e => setForm({ custom_domain: e.target.value })}
            placeholder="yourrestaurant.com"
            style={inputStyle}
            {...focusStyle}
          />
        </Field>
        <div style={{ marginTop: 16 }}>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Domain'}
          </Button>
        </div>
      </Card>

      {domain && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <SectionHeader title="Status" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <StatusRow
                label="Website connected"
                ok={verified}
                pendingText="Add the DNS records below at your domain provider"
                okText={`Live at https://${domain}`}
              />
              <StatusRow
                label="Email sending verified"
                ok={emailVerified}
                pendingText="Contact form submissions will arrive via mailto: until email is verified"
                okText={`Inquiries send from inquiries@${domain}`}
              />
            </div>
          </Card>

          <Card>
            <SectionHeader
              title="DNS Setup"
              subtitle="Add these records at GoDaddy / Squarespace / Namecheap / wherever you bought the domain."
            />
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 12 }}>
              The exact DNS records will be available once we wire up the Vercel + Resend integration (next step).
              For now, save your domain here and we'll generate them in the next deploy.
            </p>
          </Card>
        </>
      )}
    </>
  )
}

function StatusRow({ label, ok, okText, pendingText }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span
        style={{
          width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 6,
          background: ok ? 'var(--success)' : 'var(--warning)',
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
          {ok ? okText : pendingText}
        </div>
      </div>
    </div>
  )
}

/* ─── Shared bits ───────────────────────────────────────────── */
function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}

function SaveBar({ onSave, saving }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
      <Button variant="primary" size="lg" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </div>
  )
}

const focusStyle = {
  onFocus: e => (e.target.style.borderColor = 'var(--gold)'),
  onBlur: e => (e.target.style.borderColor = 'var(--border)'),
}
