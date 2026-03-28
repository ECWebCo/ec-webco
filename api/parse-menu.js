module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { menuText } = req.body
  if (!menuText) return res.status(400).json({ error: 'No menu text provided' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `Parse this restaurant menu text into structured JSON. Return ONLY valid JSON, no explanation, no markdown.

The JSON must follow this exact format:
{
  "sections": [
    {
      "name": "Section Name",
      "items": [
        {
          "name": "Item Name",
          "price": "12.00",
          "description": "Item description if available"
        }
      ]
    }
  ]
}

Rules:
- price should be just the number like "12.00" or "8.50", no $ sign
- If no price found, use ""
- If no description, use ""
- Group items into logical sections
- If no sections are clear, put everything in one section called "Menu"
- Keep descriptions to 10 words max or leave empty
- Skip duplicate items

Menu text to parse:
${menuText}`
        }]
      })
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    // Parse the JSON response
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    return res.status(200).json(parsed)
  } catch (err) {
    console.error('Parse menu error:', err)
    return res.status(500).json({ error: 'Failed to parse menu' })
  }
}
