module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, email, restaurantName } = req.body

  if (!message || !email) {
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
        to: 'evan@ecwebco.com',
        reply_to: email,
        subject: `Change Request — ${restaurantName || 'Restaurant'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
            <div style="background: #B8962E; width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
              <span style="color: white; font-weight: 700; font-size: 16px;">EC</span>
            </div>
            <h2 style="margin: 0 0 8px; font-size: 18px; color: #1A1A1A;">New Change Request</h2>
            <p style="margin: 0 0 24px; color: #7A7875; font-size: 14px;">From ${restaurantName || 'a restaurant'}</p>
            <div style="background: #F7F7F5; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 15px; color: #1A1A1A; line-height: 1.6;">${message}</p>
            </div>
            <p style="margin: 0; font-size: 13px; color: #7A7875;">
              Reply to this email to respond directly to <strong>${email}</strong>
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
    console.error('Email error:', err)
    return res.status(500).json({ error: err.message })
  }
}
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, email, restaurantName } = req.body

  if (!message || !email) {
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
        from: 'EC Web Co <onboarding@resend.dev>',
        to: 'evan@ecwebco.com',
        reply_to: email,
        subject: `Change Request — ${restaurantName || 'Restaurant'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
            <div style="background: #B8962E; width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
              <span style="color: white; font-weight: 700; font-size: 16px;">EC</span>
            </div>
            <h2 style="margin: 0 0 8px; font-size: 18px; color: #1A1A1A;">New Change Request</h2>
            <p style="margin: 0 0 24px; color: #7A7875; font-size: 14px;">From ${restaurantName || 'a restaurant'}</p>
            <div style="background: #F7F7F5; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 15px; color: #1A1A1A; line-height: 1.6;">${message}</p>
            </div>
            <p style="margin: 0; font-size: 13px; color: #7A7875;">
              Reply to this email to respond directly to <strong>${email}</strong>
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
    console.error('Email error:', err)
    return res.status(500).json({ error: err.message })
  }
}
