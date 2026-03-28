# EC Web Co — Website Manager

A clean, modern dashboard for restaurant owners to manage their website content.

---

## Quick Start

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a free project
2. In the dashboard, go to **SQL Editor → New Query**
3. Paste the entire contents of `supabase-schema.sql` and click **Run**
4. Go to **Storage** and create two buckets:
   - `restaurant-photos` (public: ✅)
   - `menu-photos` (public: ✅)

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in your values from **Supabase → Settings → API**:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

### 4. Add Your First Restaurant Client

1. In Supabase → **Authentication → Users** → Invite user (enter their email)
2. Copy their User UUID
3. In SQL Editor, run:

```sql
insert into restaurants (name, slug, owner_id)
values (
  'La Bella Cucina',
  'la-bella-cucina',
  'PASTE-UUID-HERE'
);
```

They'll receive a magic link email. Done — they can now log in.

---

## Deploy to Vercel (Free)

```bash
npm install -g vercel
vercel
```

Add your two env vars in the Vercel dashboard under **Settings → Environment Variables**.

---

## Connecting to a Restaurant Website

On each restaurant's existing website, fetch their data using the slug:

```js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Fetch all data for a restaurant by slug
async function getRestaurantData(slug) {
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name')
    .eq('slug', slug)
    .single()

  const id = restaurant.id

  const [menu, hours, links, photos] = await Promise.all([
    supabase.from('menu_sections').select('*, menu_items(*)').eq('restaurant_id', id).order('sort_order'),
    supabase.from('hours').select('*').eq('restaurant_id', id).order('day_of_week'),
    supabase.from('links').select('*').eq('restaurant_id', id).single(),
    supabase.from('photos').select('*').eq('restaurant_id', id).order('sort_order'),
  ])

  return { restaurant, menu: menu.data, hours: hours.data, links: links.data, photos: photos.data }
}

// Track a button click (analytics)
async function trackEvent(restaurantId, eventType) {
  await supabase.from('analytics_events').insert({ restaurant_id: restaurantId, event_type: eventType })
}

// Usage:
trackEvent(restaurantId, 'order_click')   // when Order button clicked
trackEvent(restaurantId, 'page_view')     // on page load
trackEvent(restaurantId, 'phone_click')   // when phone number clicked
trackEvent(restaurantId, 'reserve_click') // when reserve button clicked
```

Data updates in the dashboard are **instantly reflected** on the website — no sync needed.

---

## Adding More Clients

Repeat the Supabase step for each new restaurant. Each owner:
- Logs in with their email
- Sees **only their own** restaurant data (enforced by Row Level Security)
- Cannot see or edit any other restaurant

---

## Project Structure

```
src/
  components/
    layout/
      DashboardLayout.jsx   # Sidebar, mobile nav, request modal
    pages/
      LoginPage.jsx
      DashboardPage.jsx     # Analytics metrics + chart
      MenuPage.jsx          # Sections, items, drag-to-reorder
      HoursPage.jsx         # Weekly hours + special hours
      LinksPage.jsx         # Order/reserve/phone links
      PhotosPage.jsx        # Photo upload grid
    ui/
      index.jsx             # Button, Toggle, Modal, Field, Toast, etc.
  hooks/
    useAuth.jsx             # Auth context (session, restaurant, signIn, signOut)
  lib/
    supabase.js             # Supabase client
  App.jsx                   # Routes
  main.jsx                  # Entry point
supabase-schema.sql         # Full DB schema + RLS policies
```
