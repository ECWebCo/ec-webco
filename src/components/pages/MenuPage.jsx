import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { PageHeader, Button, Modal, Field, inputStyle, Toggle, Spinner, Card, toast } from '../ui'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function MenuPage() {
  const { restaurant } = useAuth()
  const [locations, setLocations] = useState([])
  const [activeLocId, setActiveLocId] = useState(null)
  const [sections, setSections] = useState([])
  const [items, setItems] = useState({})
  const [loading, setLoading] = useState(true)

  const [menuText, setMenuText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [showAI, setShowAI] = useState(false)

  const [sectionModal, setSectionModal] = useState({ open: false, data: null })
  const [itemModal, setItemModal] = useState({ open: false, sectionId: null, data: null })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const isPerLocation = restaurant?.menu_mode === 'per_location'

  useEffect(() => {
    if (restaurant?.id) initLoad()
  }, [restaurant?.id])

  useEffect(() => {
    if (restaurant?.id) loadSections()
  }, [activeLocId, restaurant?.id])

  async function initLoad() {
    setLoading(true)
    if (isPerLocation) {
      const { data: locs } = await supabase
        .from('locations')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order')
      setLocations(locs || [])
      if (locs?.length) {
        setActiveLocId(locs[0].id)
      } else {
        setLoading(false)
      }
    } else {
      setLocations([])
      setActiveLocId(null)
      loadSections()
    }
  }

  async function loadSections() {
    setLoading(true)
    let secsQuery = supabase
      .from('menu_sections')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('sort_order')

    if (isPerLocation) {
      if (!activeLocId) {
        setLoading(false)
        return
      }
      secsQuery = secsQuery.eq('location_id', activeLocId)
    } else {
      secsQuery = secsQuery.is('location_id', null)
    }

    const { data: secs } = await secsQuery
    const secIds = (secs || []).map(s => s.id)
    let its = []
    if (secIds.length) {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .in('section_id', secIds)
        .order('sort_order')
      its = data || []
    }

    setSections(secs || [])
    const grouped = {}
    ;(secs || []).forEach(s => {
      grouped[s.id] = its.filter(i => i.section_id === s.id)
    })
    setItems(grouped)
    setLoading(false)
  }

  async function parseMenu() {
    if (!menuText.trim()) return
    setParsing(true)
    try {
      const res = await fetch('/api/parse-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuText }),
      })
      const data = await res.json()
      if (data.sections) {
        for (let si = 0; si < data.sections.length; si++) {
          const sec = data.sections[si]
          if (!sec.name) continue
          const { data: sData } = await supabase
            .from('menu_sections')
            .insert({
              restaurant_id: restaurant.id,
              location_id: isPerLocation ? activeLocId : null,
              name: sec.name,
              sort_order: sections.length + si,
            })
            .select()
            .single()
          if (sData) {
            for (let ii = 0; ii < sec.items.length; ii++) {
              const item = sec.items[ii]
              if (!item.name) continue
              await supabase.from('menu_items').insert({
                restaurant_id: restaurant.id,
                section_id: sData.id,
                name: item.name,
                price: parseFloat(item.price) || null,
                description: item.description || '',
                available: true,
                sort_order: ii,
              })
            }
          }
        }
        setShowAI(false)
        setMenuText('')
        toast('Menu imported successfully!')
        loadSections()
      }
    } catch (err) {
      toast('Failed to parse menu', 'error')
    } finally {
      setParsing(false)
    }
  }

  async function saveSection(formData) {
    if (formData.id) {
      await supabase
        .from('menu_sections')
        .update({
          name: formData.name,
          note: formData.note || null,
          external_url: formData.external_url || null,
        })
        .eq('id', formData.id)
    } else {
      await supabase.from('menu_sections').insert({
        name: formData.name,
        note: formData.note || null,
        external_url: formData.external_url || null,
        restaurant_id: restaurant.id,
        location_id: isPerLocation ? activeLocId : null,
        sort_order: sections.length,
      })
    }
    setSectionModal({ open: false, data: null })
    toast('Section saved')
    loadSections()
  }

  async function deleteSection(id) {
    if (!confirm('Delete this section and all its items?')) return
    await supabase.from('menu_items').delete().eq('section_id', id)
    await supabase.from('menu_sections').delete().eq('id', id)
    toast('Section deleted')
    loadSections()
  }

  async function saveItem(formData, file) {
    let photo_url = formData.photo_url
    if (file) {
      const path = `${restaurant.id}/${Date.now()}-${file.name}`
      const { data: upload } = await supabase.storage.from('menu-photos').upload(path, file)
      if (upload) {
        const { data: url } = supabase.storage.from('menu-photos').getPublicUrl(path)
        photo_url = url.publicUrl
      }
    }
    const payload = {
      name: formData.name,
      price: parseFloat(formData.price) || null,
      description: formData.description,
      photo_url,
      available: formData.available ?? true,
    }
    if (formData.id) {
      await supabase.from('menu_items').update(payload).eq('id', formData.id)
    } else {
      await supabase.from('menu_items').insert({
        ...payload,
        section_id: formData.sectionId,
        restaurant_id: restaurant.id,
        sort_order: (items[formData.sectionId] || []).length,
      })
    }
    setItemModal({ open: false, sectionId: null, data: null })
    toast('Item saved')
    loadSections()
  }

  async function deleteItem(id) {
    await supabase.from('menu_items').delete().eq('id', id)
    toast('Item removed')
    loadSections()
  }

  async function toggleItem(id, available) {
    await supabase.from('menu_items').update({ available }).eq('id', id)
    setItems(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(sid => {
        next[sid] = next[sid].map(i => (i.id === id ? { ...i, available } : i))
      })
      return next
    })
  }

  async function handleSectionDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const oldIdx = sections.findIndex(s => s.id === active.id)
    const newIdx = sections.findIndex(s => s.id === over.id)
    const reordered = arrayMove(sections, oldIdx, newIdx)
    setSections(reordered)
    await Promise.all(
      reordered.map((s, i) => supabase.from('menu_sections').update({ sort_order: i }).eq('id', s.id))
    )
  }

  if (loading) return <div style={{ padding: 28 }}><Spinner /></div>

  const activeLoc = locations.find(l => l.id === activeLocId)

  return (
    <div style={{ padding: '24px 28px 32px' }}>
      <PageHeader
        title="Menu"
        subtitle={
          isPerLocation
            ? `Editing menu for ${activeLoc?.name || 'this storefront'}`
            : 'Manage your menu sections and items'
        }
        action={
          <Button variant="primary" onClick={() => setSectionModal({ open: true, data: null })}>
            ＋ Add Section
          </Button>
        }
      />

      {/* Per-location switcher */}
      {isPerLocation && locations.length > 1 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 500 }}>
            Editing menu for storefront:
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {locations.map(l => (
              <button
                key={l.id}
                onClick={() => setActiveLocId(l.id)}
                style={{
                  padding: '8px 14px',
                  background: activeLocId === l.id ? 'var(--gold)' : 'var(--bg)',
                  color: activeLocId === l.id ? '#fff' : 'var(--muted)',
                  border: '1px solid ' + (activeLocId === l.id ? 'var(--gold)' : 'var(--border)'),
                  borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {l.name}
              </button>
            ))}
          </div>
        </Card>
      )}

      {isPerLocation && locations.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 14, marginBottom: 12 }}>
            You've enabled per-location menus, but you don't have any storefronts yet.
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            Add a storefront in the Storefronts tab to start building its menu.
          </p>
        </Card>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map(section => (
            <SortableSection
              key={section.id}
              section={section}
              items={items[section.id] || []}
              onEditSection={() => setSectionModal({ open: true, data: section })}
              onDeleteSection={() => deleteSection(section.id)}
              onAddItem={() => setItemModal({ open: true, sectionId: section.id, data: null })}
              onEditItem={item => setItemModal({ open: true, sectionId: section.id, data: item })}
              onDeleteItem={deleteItem}
              onToggleItem={toggleItem}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* AI Menu Import */}
      <div
        style={{
          background: 'var(--gold-light)', border: '1px solid #E8D49A',
          borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showAI ? 12 : 0 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--gold-dark)' }}>✦ AI Menu Import</div>
            <div style={{ fontSize: 12, color: 'var(--gold-dark)', opacity: 0.8, marginTop: 2 }}>
              Paste menu text and AI structures it automatically
            </div>
          </div>
          <Button size="sm" variant="primary" onClick={() => setShowAI(!showAI)}>
            {showAI ? 'Cancel' : 'Paste Menu'}
          </Button>
        </div>
        {showAI && (
          <div style={{ marginTop: 12 }}>
            <textarea
              value={menuText}
              onChange={e => setMenuText(e.target.value)}
              placeholder="Paste menu text here…"
              style={{ ...inputStyle, width: '100%', height: 140, resize: 'vertical', lineHeight: 1.5, background: '#fff' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <Button variant="primary" onClick={parseMenu} disabled={!menuText.trim() || parsing}>
                {parsing ? 'Parsing…' : '✦ Parse with AI'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {sections.length === 0 && (!isPerLocation || activeLocId) && (
        <Card style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🍽</div>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>No menu sections yet</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Add your first section to get started</div>
          <Button variant="primary" onClick={() => setSectionModal({ open: true, data: null })}>
            ＋ Add Section
          </Button>
        </Card>
      )}

      {(!isPerLocation || activeLocId) && (
        <button
          onClick={() => setSectionModal({ open: true, data: null })}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px',
            background: 'var(--surface)', border: '2px dashed var(--border)',
            borderRadius: 'var(--radius)', cursor: 'pointer',
            color: 'var(--muted)', fontSize: 13, fontFamily: 'inherit',
            width: '100%', marginTop: 12, transition: '0.15s',
          }}
        >
          ＋ Add a new section
        </button>
      )}

      <SectionModal
        open={sectionModal.open}
        data={sectionModal.data}
        onClose={() => setSectionModal({ open: false, data: null })}
        onSave={saveSection}
      />

      <ItemModal
        open={itemModal.open}
        sectionId={itemModal.sectionId}
        data={itemModal.data}
        onClose={() => setItemModal({ open: false, sectionId: null, data: null })}
        onSave={saveItem}
      />
    </div>
  )
}

function SortableSection({ section, items, onEditSection, onDeleteSection, onAddItem, onEditItem, onDeleteItem, onToggleItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        marginBottom: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '13px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#FAFAF8', borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span {...attributes} {...listeners} style={{ color: 'var(--subtle)', cursor: 'grab', fontSize: 16, userSelect: 'none' }}>
            ⠿
          </span>
          <span style={{ fontSize: 15, fontWeight: 500 }}>{section.name}</span>
          {section.note && (
            <span
              style={{
                fontSize: 10, padding: '2px 8px',
                background: 'var(--gold-light)', color: 'var(--gold-dark)',
                borderRadius: 10, fontWeight: 500,
              }}
            >
              {section.note}
            </span>
          )}
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{items.length} items</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="sm" variant="ghost" onClick={onEditSection}>Edit</Button>
          <Button size="sm" variant="danger" onClick={onDeleteSection}>Delete</Button>
        </div>
      </div>

      {items.map(item => (
        <div
          key={item.id}
          style={{
            padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 14,
            borderBottom: '1px solid var(--border)', opacity: item.available ? 1 : 0.55,
          }}
        >
          <span style={{ color: 'var(--subtle)', fontSize: 16, cursor: 'grab' }}>⠿</span>
          <div
            style={{
              width: 44, height: 44, borderRadius: 8,
              background: 'var(--bg)', border: '1px solid var(--border)',
              overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}
          >
            {item.photo_url ? <img src={item.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
              {item.name}
              {!item.available && <span style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 500 }}>Sold Out</span>}
            </div>
            {item.description && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.description}
              </div>
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, marginRight: 8, flexShrink: 0 }}>
            {item.price ? `$${Number(item.price).toFixed(2)}` : '—'}
          </div>
          <Toggle checked={item.available} onChange={v => onToggleItem(item.id, v)} />
          <Button size="sm" variant="ghost" onClick={() => onEditItem(item)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => onDeleteItem(item.id)}>✕</Button>
        </div>
      ))}

      <button
        onClick={onAddItem}
        style={{
          padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 8,
          color: 'var(--muted)', fontSize: 13, cursor: 'pointer', border: 'none',
          background: 'none', fontFamily: 'inherit', width: '100%', transition: '0.15s',
        }}
      >
        ＋ Add item to {section.name}
      </button>
    </div>
  )
}

function SectionModal({ open, data, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', note: '', external_url: '' })
  useEffect(() => {
    setForm({
      name: data?.name || '',
      note: data?.note || '',
      external_url: data?.external_url || '',
    })
  }, [data, open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={data ? 'Edit Section' : 'Add Section'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave({ ...data, ...form })} disabled={!form.name.trim()}>
            Save
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Section name">
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Appetizers, Mains, Happy Hour"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </Field>
        <Field label="Note (optional)">
          <input
            value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder='e.g. "Tue–Fri 3–6PM · 7 for $7"'
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </Field>
        <Field label='"View Full Menu" link (optional)'>
          <input
            type="url"
            value={form.external_url}
            onChange={e => setForm(f => ({ ...f, external_url: e.target.value }))}
            placeholder="https://yourrestaurant.com/full-menu"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </Field>
      </div>
    </Modal>
  )
}

function ItemModal({ open, sectionId, data, onClose, onSave }) {
  const [form, setForm] = useState({})
  const [file, setFile] = useState(null)
  useEffect(() => {
    setForm({ name: '', price: '', description: '', available: true, ...data })
    setFile(null)
  }, [data, open])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={data ? 'Edit Item' : 'Add Item'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave({ ...form, sectionId }, file)} disabled={!form.name?.trim()}>
            Save Item
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Item name">
          <input
            value={form.name || ''}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Chicken Parmesan"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </Field>
        <Field label="Price">
          <input
            value={form.price || ''}
            onChange={e => set('price', e.target.value)}
            placeholder="e.g. 24.00"
            style={{ ...inputStyle, width: 120 }}
            onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </Field>
        <Field label="Description (optional)">
          <textarea
            value={form.description || ''}
            onChange={e => set('description', e.target.value)}
            placeholder="Briefly describe the dish…"
            style={{ ...inputStyle, height: 72, resize: 'vertical', lineHeight: 1.5 }}
            onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </Field>
        <Field label="Photo (optional)">
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} style={{ fontSize: 13, color: 'var(--muted)' }} />
        </Field>
        <Toggle checked={form.available ?? true} onChange={v => set('available', v)} label="Available to order" />
      </div>
    </Modal>
  )
}
