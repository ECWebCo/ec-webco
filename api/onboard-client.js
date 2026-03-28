export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, restaurantName, dashboardUrl } = req.body

  if (!email || !restaurantName) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'EC Web Co <noreply@ecwebco.com>',
        to: email,
        subject: `Welcome to EC Web Co — Your website is ready`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 32px; background: #F7F4EF;">

            <div style="margin-bottom: 32px;">
              <img src="https://manage.ecwebco.com/ec-logo.png" alt="EC Web Co" style="height: 32px;" />
            </div>

            <div style="background: #fff; border-radius: 12px; padding: 40px; margin-bottom: 24px;">
              <h1 style="font-size: 24px; font-weight: 600; color: #1A1A1A; margin: 0 0 8px;">Welcome to EC Web Co!</h1>
              <p style="font-size: 15px; color: #7A7875; margin: 0 0 28px; line-height: 1.6;">
                Hi there! Your website manager account for <strong style="color: #1A1A1A;">${restaurantName}</strong> is ready to go.
              </p>

              <div style="background: #F5EDD0; border: 1px solid #E8D49A; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
                <p style="font-size: 13px; color: #7A5F1A; margin: 0 0 12px; font-weight: 500;">Your dashboard link</p>
                <a href="${dashboardUrl || 'https://manage.ecwebco.com'}" style="font-size: 14px; color: #B8962E; word-break: break-all;">
                  ${dashboardUrl || 'https://manage.ecwebco.com'}
                </a>
              </div>

              <h2 style="font-size: 16px; font-weight: 600; color: #1A1A1A; margin: 0 0 16px;">What you can do in your dashboard</h2>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                ${[
                  ['📋', 'Menu', 'Add, edit, and update your menu items and prices instantly'],
                  ['🕐', 'Hours', 'Set your opening hours and mark special holiday hours'],
                  ['🔗', 'Links', 'Update your order online, reservation, and phone links'],
                  ['📸', 'Photos', 'Upload and manage photos shown on your website'],
                  ['📊', 'Dashboard', 'See how many visitors and clicks your website gets'],
                ].map(([icon, title, desc]) => `
                  <div style="display: flex; gap: 14px; align-items: flex-start;">
                    <span style="font-size: 20px; flex-shrink: 0;">${icon}</span>
                    <div>
                      <div style="font-size: 14px; font-weight: 500; color: #1A1A1A; margin-bottom: 2px;">${title}</div>
                      <div style="font-size: 13px; color: #7A7875; line-height: 1.5;">${desc}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div style="background: #fff; border-radius: 12px; padding: 28px; margin-bottom: 24px;">
              <h2 style="font-size: 15px; font-weight: 600; color: #1A1A1A; margin: 0 0 12px;">Getting started</h2>
              <ol style="font-size: 14px; color: #7A7875; line-height: 1.8; padding-left: 20px; margin: 0;">
                <li>Click the dashboard link above and sign in</li>
                <li>Upload your photos and set your hero image</li>
                <li>Add your menu sections and items</li>
                <li>Set your hours and update your links</li>
                <li>Your website updates instantly — no waiting!</li>
              </ol>
            </div>

            <p style="font-size: 13px; color: #7A7875; text-align: center; line-height: 1.6;">
              Questions? Just reply to this email or reach us at
              <a href="mailto:evan@ecwebco.com" style="color: #B8962E;">evan@ecwebco.com</a>
            </p>

            <p style="font-size: 12px; color: #C2BFB8; text-align: center; margin-top: 24px;">
              EC Web Co · Houston, Texas
            </p>
          </div>
        `
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to send email')
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Onboarding email error:', err)
    return res.status(500).json({ error: err.message })
  }
}
