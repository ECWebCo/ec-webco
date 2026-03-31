import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { PageHeader, Button, Field, inputStyle, toast, Card, Spinner } from '../ui'

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
          color_ink: form.color_ink || null,
          color_gold: form.color_gold || null,
          color_off: form.color_off || null,
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
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, color: 'var(--text)' }}>Brand Colors</div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>Pick 3 colors for your website — primary text, accent, and background</p>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { key: 'color_ink', label: 'Primary (text & nav)', default: '#0D0D0D' },
            { key: 'color_gold', label: 'Accent (buttons & highlights)', default: '#C9A84C' },
            { key: 'color_off', label: 'Background', default: '#F7F4EF' },
          ].map(c => (
            <div key={c.key} style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 12, minWidth: 180 }}>
              <input type="color" value={form[c.key] || c.default}
                onChange={e => set(c.key, e.target.value)}
                style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--border)', cursor: 'pointer', padding: 2, background: 'none' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{form[c.key] || c.default}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: 16, borderRadius: 8, background: form.color_ink || '#0D0D0D', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 13, color: form.color_off || '#F7F4EF', fontFamily: 'DM Sans, sans-serif' }}>Preview:</div>
          <div style={{ padding: '8px 16px', background: form.color_gold || '#C9A84C', color: '#fff', fontSize: 12, borderRadius: 4, fontFamily: 'DM Sans, sans-serif' }}>Button</div>
          <div style={{ fontSize: 14, color: form.color_off || '#F7F4EF', fontFamily: 'Playfair Display, serif', fontStyle: 'italic' }}>Restaurant Name</div>
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
