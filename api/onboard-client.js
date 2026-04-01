const { createClient } = require('@supabase/supabase-js')

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, restaurantName, restaurantId } = req.body
  if (!email || !restaurantName || !restaurantId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    let user = existingUsers?.users?.find(u => u.email === email)

    if (!user) {
      // Create the user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true
      })
      if (createError) throw createError
      user = newUser.user
    }

    // Link user to restaurant
    await supabaseAdmin.from('restaurants').update({ owner_id: user.id }).eq('id', restaurantId)

    // Send magic link
    const { error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: 'https://manage.ecwebco.com' }
    })
    if (linkError) throw linkError

    // Send welcome email via Resend with the magic link
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: 'https://manage.ecwebco.com' }
    })

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'EC Web Co <noreply@ecwebco.com>',
        to: email,
        subject: `Your ${restaurantName} website is ready`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
            <h2 style="font-family: Georgia, serif; font-size: 28px; color: #1A1A1A; margin-bottom: 8px;">
              Welcome to EC Web Co
            </h2>
            <p style="color: #666; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
              Your <strong>${restaurantName}</strong> website manager is ready. Click the button below to sign in — no password needed.
            </p>
            <a href="${linkData?.properties?.action_link}" 
               style="display: inline-block; padding: 14px 28px; background: #C9A84C; color: #fff; text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 4px; margin-bottom: 32px;">
              Access Your Dashboard →
            </a>
            <p style="color: #999; font-size: 13px; line-height: 1.6;">
              This link expires in 24 hours. After that, go to <a href="https://manage.ecwebco.com" style="color: #C9A84C;">manage.ecwebco.com</a>, enter your email, and we'll send you a new link.
            </p>
            <hr style="border: none; border-top: 1px solid #E8E2D9; margin: 32px 0;" />
            <p style="color: #bbb; font-size: 12px;">EC Web Co · Restaurant Website Manager</p>
          </div>
        `
      })
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Onboard error:', err)
    return res.status(500).json({ error: err.message || 'Failed to onboard client' })
  }
}
