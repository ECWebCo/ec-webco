const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, restaurantName, restaurantId, stripeLink } = req.body

  if (!email || !restaurantName) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Create user account
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true
    })

    if (userError && !userError.message.includes('already been registered')) {
      throw userError
    }

    const userId = userData?.user?.id

    // Link user to restaurant
    if (userId && restaurantId) {
      await supabaseAdmin
        .from('restaurants')
        .update({ owner_id: userId })
        .eq('id', restaurantId)
    }

    const setupLink = `https://manage.ecwebco.com/setup?email=${encodeURIComponent(email)}`

    const stripeSection = stripeLink ? `
      <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #166534; margin: 0 0 12px; font-weight: 500;">Complete your setup</p>
        <p style="font-size: 14px; color: #166534; margin: 0 0 14px; line-height: 1.6;">
          To activate your website, please complete your payment below.
        </p>
        <a href="${stripeLink}" style="display: inline-block; padding: 12px 24px; background: #16A34A; color: #fff; font-size: 13px; font-weight: 500; text-decoration: none; border-radius: 6px;">
          Complete Payment
        </a>
      </div>
    ` : ''

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'EC Web Co <noreply@ecwebco.com>',
        to: email,
        subject: `Welcome to EC Web Co — Set up your account`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 32px; background: #F7F4EF;">
            <div style="margin-bottom: 32px;">
              <img src="https://manage.ecwebco.com/ec-logo.png" alt="EC Web Co" style="height: 32px;" />
            </div>
            <div style="background: #fff; border-radius: 12px; padding: 40px; margin-bottom: 24px;">
              <h1 style="font-size: 24px; font-weight: 600; color: #1A1A1A; margin: 0 0 8px;">Welcome to EC Web Co!</h1>
              <p style="font-size: 15px; color: #7A7875; margin: 0 0 28px; line-height: 1.6;">
                Hi there! Your website manager account for <strong style="color: #1A1A1A;">${restaurantName}</strong> is ready. Click below to set up your password and get started.
              </p>

              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${setupLink}" style="display: inline-block; padding: 16px 36px; background: #B8962E; color: #fff; font-size: 14px; font-weight: 500; text-decoration: none; border-radius: 8px;">
                  Set Up My Account
                </a>
              </div>

              ${stripeSection}

              <p style="font-size: 13px; color: #C2BFB8; text-align: center; margin: 0;">
                Setup link: <a href="${setupLink}" style="color: #B8962E;">${setupLink}</a>
              </p>
            </div>

            <div style="background: #fff; border-radius: 12px; padding: 28px; margin-bottom: 24px;">
              <h2 style="font-size: 15px; font-weight: 600; color: #1A1A1A; margin: 0 0 16px;">What you can do in your dashboard</h2>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;font-size:20px;width:32px;">📋</td><td style="padding:8px 0;font-size:14px;color:#7A7875;"><strong style="color:#1A1A1A">Menu</strong> — Add and update your menu items and prices</td></tr>
                <tr><td style="padding:8px 0;font-size:20px;">🕐</td><td style="padding:8px 0;font-size:14px;color:#7A7875;"><strong style="color:#1A1A1A">Hours</strong> — Set your opening hours and holiday hours</td></tr>
                <tr><td style="padding:8px 0;font-size:20px;">🔗</td><td style="padding:8px 0;font-size:14px;color:#7A7875;"><strong style="color:#1A1A1A">Links</strong> — Update your order and reservation links</td></tr>
                <tr><td style="padding:8px 0;font-size:20px;">📸</td><td style="padding:8px 0;font-size:14px;color:#7A7875;"><strong style="color:#1A1A1A">Photos</strong> — Upload photos shown on your website</td></tr>
                <tr><td style="padding:8px 0;font-size:20px;">📊</td><td style="padding:8px 0;font-size:14px;color:#7A7875;"><strong style="color:#1A1A1A">Dashboard</strong> — See your website visitors and clicks</td></tr>
              </table>
            </div>

            <p style="font-size: 13px; color: #7A7875; text-align: center; line-height: 1.6;">
              Questions? Reply to this email or reach us at
              <a href="mailto:evan@ecwebco.com" style="color: #B8962E;">evan@ecwebco.com</a>
            </p>
            <p style="font-size: 12px; color: #C2BFB8; text-align: center; margin-top: 24px;">
              EC Web Co · Houston, Texas
            </p>
          </div>
        `
      })
    })

    if (!emailRes.ok) {
      const err = await emailRes.json()
      throw new Error(err.message || 'Failed to send email')
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Onboarding error:', err)
    return res.status(500).json({ error: err.message })
  }
}
