import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { PageHeader, Button, Toggle, Spinner, Card, toast } from '../ui'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const DEFAULT_HOURS = DAYS.map((_, i) => ({
  day_of_week: i,
  open_time: '11:00',
  close_time: '21:00',
  closed: i === 1, // Monday closed by default
  label: null
}))

export default function HoursPage() {
  const { restaurant } = useAuth()
  const [hours, setHours] = useState(DEFAULT_HOURS)
  const [specials, setSpecials] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (restaurant?.id) load() }, [restaurant?.id])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('hours').select('*').eq('restaurant_id', restaurant.id).order('day_of_week')
    if (data && data.length > 0) {
      const regular = data.filter(h => h.label === null)
      const special = data.filter(h => h.label !== null)
      // Fill all 7 days
      const filled = DAYS.map((_, i) => {
        const found = regular.find(h => h.day_of_week === i)
        return found || { day_of_week: i, open_time: '11:00', close_time: '21:00', closed: false, label: null }
      })
      setHours(filled)
      setSpecials(special)
    }
    setLoading(false)
  }

  function updateHour(dayIdx, field, value) {
    setHours(h => h.map((row, i) => i === dayIdx ? { ...row, [field]: value } : row))
  }

  function updateSpecial(idx, field, value) {
    setSpecials(s => s.map((row, i) => i === idx ? { ...row, [field]: value } : row))
  }

  function addSpecial() {
    setSpecials(s => [...s, { open_time: '12:00', close_time: '20:00', closed: false, label: 'Holiday' }])
  }

  function removeSpecial(idx) {
    setSpecials(s => s.filter((_, i) => i !== idx))
  }

  async function save() {
    setSaving(true)
    // Delete existing and re-insert
    await supabase.from('hours').delete().eq('restaurant_id', restaurant.id)
    const rows = [
      ...hours.map(h => ({ ...h, restaurant_id: restaurant.id })),
      ...specials.map(s => ({ ...s, restaurant_id: restaurant.id }))
    ]
    await supabase.from('hours').insert(rows)
    toast('Hours saved!')
    setSaving(false)
  }

  if (loading) return <div style={{ padding: 28 }}><Spinner /></div>

  const timeInput = {
    padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    fontSize: 14, fontFamily: 'inherit', color: 'var(--text)', background: 'var(--bg)',
    outline: 'none', width: 120
  }

  return (
    <div style={{ padding: '24px 28px 32px', maxWidth: 640 }}>
      <PageHeader title="Hours" subtitle="Set your opening times for each day of the week" />

      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        {hours.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: i < 6 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ width: 100, fontSize: 14, fontWeight: 500 }}>{DAYS[i]}</div>
            {row.closed ? (
              <div style={{ flex: 1, fontSize: 13, padding: '4px 12px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 20, display: 'inline-block', width: 'fit-content' }}>Closed</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                <input type="time" value={row.open_time || ''} onChange={e => updateHour(i, 'open_time', e.target.value)} style={timeInput} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>to</span>
                <input type="time" value={row.close_time || ''} onChange={e => updateHour(i, 'close_time', e.target.value)} style={timeInput} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
            )}
            <Toggle checked={!row.closed} onChange={v => updateHour(i, 'closed', !v)} />
          </div>
        ))}
      </Card>

      {/* Special Hours */}
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>Special / Holiday Hours</div>
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
        {specials.length === 0 && (
          <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--muted)' }}>No special hours added yet.</div>
        )}
        {specials.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: i < specials.length - 1 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap' }}>
            <input value={row.label || ''} onChange={e => updateSpecial(i, 'label', e.target.value)} placeholder="Holiday name" style={{ ...timeInput, width: 140 }} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            <input type="time" value={row.open_time || ''} onChange={e => updateSpecial(i, 'open_time', e.target.value)} style={timeInput} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>to</span>
            <input type="time" value={row.close_time || ''} onChange={e => updateSpecial(i, 'close_time', e.target.value)} style={timeInput} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            <Toggle checked={!row.closed} onChange={v => updateSpecial(i, 'closed', !v)} />
            <button onClick={() => removeSpecial(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
          </div>
        ))}
      </Card>

      <button onClick={addSpecial} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', background: 'var(--surface)', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, fontFamily: 'inherit', width: '100%', marginBottom: 24, transition: '0.15s' }}
        onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)' }}
        onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
      >＋ Add special hours</button>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="lg" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Hours'}</Button>
      </div>
    </div>
  )
}
