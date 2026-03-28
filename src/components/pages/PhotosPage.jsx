import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { PageHeader, Spinner, toast } from '../ui'

export default function PhotosPage() {
  const { restaurant } = useAuth()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  useEffect(() => { if (restaurant?.id) load() }, [restaurant?.id])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('photos').select('*').eq('restaurant_id', restaurant.id).order('sort_order')
    setPhotos(data || [])
    setLoading(false)
  }

  async function handleUpload(files) {
    if (!files?.length) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const path = `${restaurant.id}/${Date.now()}-${file.name.replace(/\s/g, '-')}`
      const { error: uploadErr } = await supabase.storage.from('restaurant-photos').upload(path, file)
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('restaurant-photos').getPublicUrl(path)
        await supabase.from('photos').insert({
          restaurant_id: restaurant.id,
          storage_path: path,
          url: urlData.publicUrl,
          is_hero: photos.length === 0,
          sort_order: photos.length
        })
      }
    }
    toast('Photos uploaded!')
    setUploading(false)
    load()
  }

  async function setHero(id) {
    await supabase.from('photos').update({ is_hero: false }).eq('restaurant_id', restaurant.id)
    await supabase.from('photos').update({ is_hero: true }).eq('id', id)
    toast('Hero image updated!')
    load()
  }

  async function deletePhoto(photo) {
    if (!confirm('Delete this photo?')) return
    await supabase.storage.from('restaurant-photos').remove([photo.storage_path])
    await supabase.from('photos').delete().eq('id', photo.id)
    toast('Photo deleted')
    load()
  }

  function handleDrop(e) {
    e.preventDefault()
    handleUpload(e.dataTransfer.files)
  }

  if (loading) return <div style={{ padding: 28 }}><Spinner /></div>

  return (
    <div style={{ padding: '24px 28px 32px' }}>
      <PageHeader
        title="Photos"
        subtitle="Manage photos shown on your website"
        action={
          <button onClick={() => fileRef.current?.click()}
            style={{ padding: '9px 18px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500, cursor: uploading ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
            {uploading ? 'Uploading…' : '＋ Upload Photos'}
          </button>
        }
      />

      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleUpload(e.target.files)} />

      {/* Drop zone (shows when no photos) */}
      {photos.length === 0 && (
        <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '60px 20px', textAlign: 'center', cursor: 'pointer', marginBottom: 24, transition: '0.15s' }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--gold)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>📸</div>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Drop photos here or click to upload</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>JPG, PNG, WebP — up to 10MB each</div>
        </div>
      )}

      {/* Info */}
      {photos.length > 0 && (
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          The <strong style={{ color: 'var(--text)' }}>Hero</strong> image appears at the top of your website. Hover any photo to set it as hero or delete it.
        </p>
      )}

      {/* Photo grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
        {photos.map(photo => (
          <div key={photo.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg)', border: '1px solid var(--border)', cursor: 'pointer' }}
            onMouseOver={e => e.currentTarget.querySelector('.overlay').style.opacity = '1'}
            onMouseOut={e => e.currentTarget.querySelector('.overlay').style.opacity = '0'}
          >
            <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {photo.is_hero && (
              <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--gold)', color: '#fff', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>
                Hero
              </div>
            )}
            <div className="overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', opacity: 0, transition: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {!photo.is_hero && (
                <button onClick={() => setHero(photo.id)} style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Set as Hero</button>
              )}
              <button onClick={() => deletePhoto(photo)} style={{ padding: '7px 14px', background: 'rgba(198,40,40,0.9)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        ))}

        {/* Upload tile */}
        <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          style={{ aspectRatio: '1', borderRadius: 'var(--radius)', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: uploading ? 'wait' : 'pointer', transition: '0.15s' }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'var(--gold-light)' }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ fontSize: 26, color: 'var(--subtle)' }}>＋</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{uploading ? 'Uploading…' : 'Add photo'}</span>
        </div>
      </div>
    </div>
  )
}
