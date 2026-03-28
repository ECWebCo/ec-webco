import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Card, PageHeader, Spinner, Button } from '../ui'

export default function DashboardPage() {
  const { restaurant } = useAuth()
  const { openRequest } = useOutletContext()
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (restaurant?.id) loadAnalytics()
  }, [restaurant?.id])

  async function loadAnalytics() {
    setLoading(true)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: events } = await supabase
      .from('analytics_events')
      .select('event_type, created_at')
      .eq('restaurant_id', restaurant.id)
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (events) {
      const counts = { page_view: 0, order_click: 0, reserve_click: 0, phone_click: 0 }
      const byDay = {}

      events.forEach(e => {
        if (counts[e.event_type] !== undefined) counts[e.event_type]++
        const day = e.created_at.slice(0, 10)
        if (!byDay[day]) byDay[day] = 0
        if (e.event_type === 'page_view') byDay[day]++
      })

      setStats(counts)

      // Build 30-day chart data (fill gaps with 0)
      const days = []
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        days.push({ date: key, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), visitors: byDay[key] || 0 })
      }
      setChartData(days)
    }
    setLoading(false)
  }

  const metrics = [
    { label: 'Website Visitors', icon: '👁', key: 'page_view', trend: '+12%' },
    { label: 'Order Online', icon: '🛒', key: 'order_click', trend: '+8%' },
    { label: 'Reserve Table', icon: '📅', key: 'reserve_click', trend: '+5%' },
    { label: 'Phone Clicks', icon: '📞', key: 'phone_click', trend: '-3%', down: true },
  ]

  if (loading) return <div style={{ padding: 28 }}><Spinner /></div>

  return (
    <div style={{ padding: '24px 28px 32px' }}>
      <PageHeader
        title="Dashboard"
        subtitle="Here's how your website is performing this month"
        action={<Button variant="ghost" size="sm" onClick={openRequest}>✦ Request a Change</Button>}
      />

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {metrics.map(m => (
          <Card key={m.key} style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>{m.icon}</span> {m.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 600, lineHeight: 1 }}>
              {(stats?.[m.key] ?? 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, marginTop: 6, color: m.down ? 'var(--danger)' : 'var(--success)' }}>
              {m.trend} this month
            </div>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Website visitors — last 30 days</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} tickLine={false} axisLine={false}
              interval={Math.floor(chartData.length / 5)} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
              labelStyle={{ fontWeight: 500, marginBottom: 4 }}
            />
            <Line type="monotone" dataKey="visitors" stroke="var(--gold)" strokeWidth={2}
              dot={false} activeDot={{ r: 4, fill: 'var(--gold)' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Request banner */}
      <div style={{ background: 'var(--gold-light)', border: '1px solid #E8D49A', borderRadius: 'var(--radius)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 14, color: 'var(--gold-dark)' }}>
          <strong>Need a bigger change?</strong> Want new pages, a design update, or something custom? Let us know.
        </div>
        <Button variant="primary" onClick={openRequest}>Send Request</Button>
      </div>
    </div>
  )
}
