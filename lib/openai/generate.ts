import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface GeneratedListing {
  title: string
  description: string
  keywords: string[]
  category: string
  suggested_price: number
  stock_quantity: number
  highlights: string[]
}

export async function generateListingFromImage(
  imageBase64: string,
  mimeType = 'image/jpeg'
): Promise<GeneratedListing> {
  const prompt = `You are an expert Shopee product listing assistant. Analyze this product image and generate a complete, optimized listing.

Return a JSON object with exactly these fields:
{
  "title": "Product title, max 120 chars, SEO optimized",
  "description": "Detailed product description, 200-500 chars",
  "keywords": ["keyword1", "keyword2"],
  "category": "Best matching Shopee category name",
  "suggested_price": <realistic price in IDR as a number>,
  "stock_quantity": <suggested initial stock, default 100>,
  "highlights": ["key selling point 1", "key selling point 2"]
}

Use Bahasa Indonesia if the product is likely for the Indonesian market, otherwise English. Be specific and realistic.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          { type: 'text', text: prompt },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('OpenAI returned empty response')

  const parsed = JSON.parse(content) as GeneratedListing
  if (!parsed.title || !parsed.description) {
    throw new Error('AI response is missing required fields')
  }

  return parsed
}
