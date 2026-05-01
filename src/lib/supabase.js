import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getRestaurantData(slug) {
  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !restaurant) return null

  const id = restaurant.id

  const [sectionsRes, itemsRes, hoursRes, linksRes, photosRes] = await Promise.all([
    supabase.from('menu_sections').select('*').eq('restaurant_id', id).order('sort_order'),
    supabase.from('menu_items').select('*').eq('restaurant_id', id).order('sort_order'),
    supabase.from('hours').select('*').eq('restaurant_id', id).order('day_of_week'),
    supabase.from('links').select('*').eq('restaurant_id', id).limit(1),
    supabase.from('photos').select('*').eq('restaurant_id', id).order('sort_order'),
  ])

  const sections = (sectionsRes.data || []).map(s => ({
    ...s,
    items: (itemsRes.data || []).filter(i => i.section_id === s.id)
  }))

  let locations = []
  try {
    const { data: locData } = await supabase
      .from('locations')
      .select('*, location_hours(*), location_links(*)')
      .eq('restaurant_id', id)
      .order('sort_order')
    locations = locData || []
  } catch (e) {
    locations = []
  }

  return {
    restaurant,
    sections,
    hours: hoursRes.data || [],
    links: linksRes.data?.[0] || {},
    photos: photosRes.data || [],
    heroPhoto: (photosRes.data || []).find(p => p.is_hero),
    locations
  }
}

export async function trackEvent(restaurantId, eventType) {
  try {
    await supabase.from('analytics_events').insert({ restaurant_id: restaurantId, event_type: eventType })
  } catch (e) {}
}