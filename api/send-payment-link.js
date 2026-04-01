const { createClient } = require('@supabase/supabase-js')

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { restaurantName, restaurantId, stripeLink } = req.body
  if (!restaurantId || !stripeLink) return res.status(400).json({ error: 'Missing fields' })

  try {
    // Get the restaurant owner's email
    const { data: restaurant } = await supabaseAdmin.from('restaurants').select('owner_id').eq('id', restaurantId).single()
    if (!restaurant?.owner_id) throw new Error('No owner linked to this restaurant yet')

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(restaurant.owner_id)
    const email = userData?.user?.email
    if (!email) throw new Error('Could not find owner email')

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'EC Web Co <noreply@ecwebco.com>',
        to: email,
        subject: `Ready to go live? — ${restaurantName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
            <h2 style="font-family: Georgia, serif; font-size: 28px; color: #1A1A1A; margin-bottom: 8px;">
              Ready to go live?
            </h2>
            <p style="color: #666; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
              Your <strong>${restaurantName}</strong> website is looking great. Complete your payment below to get your site live on your own domain.
            </p>
            <a href="${stripeLink}"
               style="display: inline-block; padding: 14px 28px; background: #C9A84C; color: #fff; text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 4px; margin-bottom: 32px;">
              Complete Payment →
            </a>
            <p style="color: #999; font-size: 13px; line-height: 1.6;">
              Questions? Just reply to this email and we'll get back to you.
            </p>
            <hr style="border: none; border-top: 1px solid #E8E2D9; margin: 32px 0;" />
            <p style="color: #bbb; font-size: 12px;">EC Web Co · Restaurant Website Manager</p>
          </div>
        `
      })
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Send payment error:', err)
    return res.status(500).json({ error: err.message || 'Failed to send' })
  }
}
