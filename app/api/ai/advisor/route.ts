import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { product, platform, category, cost, price, profit, margin, roi, mpFees, affiliate, gmv } = body

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: `You are a Malaysian marketplace seller advisor for Shopee & TikTok Shop.

Analyse: Product="${product}", Platform=${platform}, Category=${category}, Cost=RM${cost?.toFixed(2)}, Price=RM${price?.toFixed(2)}, Profit=RM${profit?.toFixed(2)}, Margin=${margin?.toFixed(1)}%, ROI=${roi?.toFixed(1)}%, MP Fees=RM${mpFees?.toFixed(2)}, Affiliate=${affiliate}, GMV=${gmv}

Respond in JSON only:
{"summary":"one sentence","rating":"Excellent|Good|Fair|Poor|Loss","tips":["tip1","tip2","tip3"],"recommendedPrice":0.00,"warning":null}`,
      }],
    })

    const text = completion.choices[0]?.message?.content || '{}'
    return NextResponse.json(JSON.parse(text))
  } catch (error) {
    console.error('AI advisor error:', error)
    return NextResponse.json({
      summary: 'Analisis lengkap setelah semua kos diisi.',
      rating: 'Fair',
      tips: ['Pastikan kos produk lengkap diisi.', 'Semak fee marketplace terkini.', 'Aktifkan marketing yang bersesuaian.'],
      recommendedPrice: 0,
      warning: null,
    })
  }
}
