import { NextRequest, NextResponse } from 'next/server'
import { generateListingFromImage } from '@/lib/openai/generate'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    if (!imageFile) return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 10 MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer())
    const base64 = buffer.toString('base64')
    const listing = await generateListingFromImage(base64, imageFile.type)

    const service = createServiceClient()

    // Store image in Supabase Storage
    const filename = `${user.id}/${Date.now()}-${imageFile.name}`
    const { data: stored, error: storeErr } = await service.storage
      .from('product-images')
      .upload(filename, buffer, { contentType: imageFile.type })

    if (storeErr) console.warn('Storage upload warning:', storeErr.message)

    const imageUrl = stored
      ? service.storage.from('product-images').getPublicUrl(filename).data.publicUrl
      : ''

    // Persist AI listing
    const { data: aiRow, error: aiErr } = await service
      .from('ai_generated_listings')
      .insert({
        user_id: user.id,
        image_url: imageUrl,
        title: listing.title,
        description: listing.description,
        keywords: listing.keywords,
        category: listing.category,
        suggested_price: listing.suggested_price,
        stock_quantity: listing.stock_quantity,
        highlights: listing.highlights,
      })
      .select()
      .single()
    if (aiErr) throw aiErr

    // Create draft product
    const { data: product, error: productErr } = await service
      .from('products')
      .insert({
        user_id: user.id,
        title: listing.title,
        description: listing.description,
        price: listing.suggested_price,
        stock: listing.stock_quantity,
        image_url: imageUrl,
        status: 'draft',
      })
      .select()
      .single()
    if (productErr) throw productErr

    return NextResponse.json({
      listing: { ...listing, imageUrl },
      product_id: product.id,
      ai_listing_id: aiRow.id,
    })
  } catch (err) {
    console.error('AI generate error:', err)
    const msg = err instanceof Error ? err.message : 'Generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
