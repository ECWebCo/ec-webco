import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { PageHeader, Button, Field, inputStyle, toast, Card, Spinner } from '../ui'

const COLOR_PALETTES = [
  { id: 'moody', label: 'Moody & Dark', preview: ['#0D0D0D', '#C9A84C', '#F7F4EF'] },
  { id: 'warm', label: 'Warm & Earthy', preview: ['#3D2B1F', '#B8962E', '#F2EDE4'] },
  { id: 'fresh', label: 'Fresh & Light', preview: ['#1A3A2A', '#4A9B6F', '#F5F9F6'] },
  { id: 'bold', label: 'Bold & Modern', preview: ['#1A1A2E', '#E94560', '#F5F5F5'] },
  { id: 'classic', label: 'Classic & Elegant', preview: ['#2C2C2C', '#8B7355', '#FAF8F5'] },
]

export default function SettingsPage() {
  const { restaurant } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', tagline: '', description: '',
    email: '', address: '', city: '', phone: '',
    logo_url: '', palette: 'moody', site_url: ''
  })

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name || '',
        tagline: restaurant.tagline || '',
        description: restaurant.description || '',
        email: restaurant.email || '',
        address: restaurant.address || '',
        city: restaurant.city || '',
        logo_url: restaurant.logo_url || '',
        palette: restaurant.palette || 'moody',
        site_url: restaurant.site_url || '',
      })
      setLoading(false)
    }
  }, [restaurant])

  async function save() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          name: form.name,
          tagline: form.tagline,
          description: form.description,
          email: form.email,
          address: form.address,
          city: form.city,
          logo_url: form.logo_url || null,
          palette: form.palette,
          site_url: form.site_url || null,
        })
        .eq('id', restaurant.id)
      if (error) throw error
      toast('Settings saved!')
    } catch (err) {
      toast(err.message || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleLogoUpload(file) {
    if (!file) return
    const path = `${restaurant.id}/logo-${Date.now()}.${file.name.split('.').pop()}`
    const { error: uploadErr } = await supabase.storage.from('restaurant-photos').upload(path, file, { upsert: true })
    if (uploadErr) { toast('Failed to upload logo', 'error'); return }
    const { data: urlData } = supabase.storage.from('restaurant-photos').getPublicUrl(path)
    set('logo_url', urlData.publicUrl)
    toast('Logo uploaded!')
  }

  if (loading) return <div style={{ padding: 28 }}><Spinner /></div>

  return (
    <div style={{ padding: '24px 28px 32px', maxWidth: 640 }}>
      <PageHeader title="Settings" subtitle="Manage your restaurant profile and appearance" />

      {/* Basic Info */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 18, color: 'var(--text)' }}>Restaurant Info</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Restaurant name">
            <input value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </Field>
          <Field label="Tagline">
            <input value={form.tagline} onChange={e => set('tagline', e.target.value)}
              placeholder="e.g. Authentic Italian since 1998" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="A short description shown on your website..."
              style={{ ...inputStyle, height: 80, resize: 'vertical', lineHeight: 1.5 }}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Contact email">
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="hello@restaurant.com" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
            <Field label="City">
              <input value={form.city} onChange={e => set('city', e.target.value)}
                placeholder="e.g. Houston, Texas" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
          </div>
          <Field label="Address">
            <input value={form.address} onChange={e => set('address', e.target.value)}
              placeholder="e.g. 1234 Westheimer Rd, Houston TX 77006" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </Field>
          <Field label="Website URL">
            <input value={form.site_url} onChange={e => set('site_url', e.target.value)}
              placeholder="e.g. https://preview.ecwebco.com/my-restaurant" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </Field>
        </div>
      </Card>

      {/* Logo */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 18, color: 'var(--text)' }}>Logo</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {form.logo_url ? (
            <div style={{ width: 80, height: 80, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              <img src={form.logo_url} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
            </div>
          ) : (
            <div style={{ width: 80, height: 80, background: 'var(--bg)', border: '2px dashed var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24, color: 'var(--subtle)' }}>
              🏷
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'inline-block', padding: '9px 18px', background: 'var(--gold)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                {form.logo_url ? 'Change Logo' : 'Upload Logo'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleLogoUpload(e.target.files[0])} />
              </label>
              {form.logo_url && (
                <button onClick={() => set('logo_url', '')} style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Remove</button>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              PNG with transparent background works best. Shown in your website header and footer.
            </p>
            {form.logo_url && (
              <Field label="Or paste URL directly" style={{ marginTop: 10 }}>
                <input value={form.logo_url} onChange={e => set('logo_url', e.target.value)} style={{ ...inputStyle, fontSize: 12 }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </Field>
            )}
          </div>
        </div>
      </Card>

      {/* Color Palette */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, color: 'var(--text)' }}>Color Palette</div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Choose the color scheme for your website</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {COLOR_PALETTES.map(p => (
            <div key={p.id} onClick={() => set('palette', p.id)} style={{
              cursor: 'pointer', border: form.palette === p.id ? '2px solid var(--gold)' : '1px solid var(--border)',
              borderRadius: 10, padding: '12px 8px', textAlign: 'center', transition: '0.15s',
              background: form.palette === p.id ? 'var(--gold-light)' : 'var(--surface)'
            }}>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 8 }}>
                {p.preview.map((c, i) => (
                  <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: c, border: '1px solid rgba(0,0,0,0.1)' }} />
                ))}
              </div>
              <div style={{ fontSize: 10, color: form.palette === p.id ? 'var(--gold-dark)' : 'var(--muted)', lineHeight: 1.3, fontWeight: form.palette === p.id ? 500 : 400 }}>{p.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="lg" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
