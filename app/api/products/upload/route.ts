import { NextRequest, NextResponse } from 'next/server'
import { uploadImageToShopee, createShopeeProduct } from '@/lib/shopee/client'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  let productId: string | undefined

  try {
    const { productId: pid, listing } = await request.json()
    productId = pid

    // Get connected Shopee account
    const { data: account, error: accErr } = await service
      .from('shopee_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (accErr || !account) {
      return NextResponse.json(
        { error: 'No Shopee account connected. Connect your account first.' },
        { status: 400 }
      )
    }

    // Auto-refresh token if expired
    if (new Date(account.token_expires_at) <= new Date()) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const refreshRes = await fetch(`${appUrl}/api/shopee/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({ shop_id: account.shop_id }),
      })
      if (!refreshRes.ok) {
        return NextResponse.json(
          { error: 'Shopee token expired. Please reconnect your account.' },
          { status: 401 }
        )
      }
      // Reload updated token
      const { data: refreshed } = await service
        .from('shopee_accounts')
        .select('access_token')
        .eq('id', account.id)
        .single()
      if (refreshed) account.access_token = refreshed.access_token
    }

    await service.from('products').update({ status: 'uploading' }).eq('id', productId)

    // Upload image to Shopee Media Space
    let shopeeImageId: string | undefined
    if (listing.imageUrl) {
      const imgRes = await fetch(listing.imageUrl)
      const imgBuf = Buffer.from(await imgRes.arrayBuffer())
      const uploaded = await uploadImageToShopee(
        imgBuf,
        `product-${Date.now()}.jpg`,
        account.access_token,
        account.shop_id
      )
      shopeeImageId = uploaded.image_id
    }

    // TODO: Map listing.category to a real Shopee category_id using v2.product.get_category.
    // Using a placeholder category_id for MVP.
    const PLACEHOLDER_CATEGORY_ID = 100001

    const result = await createShopeeProduct({
      shop_id: account.shop_id,
      access_token: account.access_token,
      item_name: listing.title,
      description: listing.description,
      price: listing.price,
      stock: listing.stock,
      category_id: PLACEHOLDER_CATEGORY_ID,
      image_ids: shopeeImageId ? [shopeeImageId] : [],
      item_status: 'NORMAL',
    })

    // Mark product as live
    await service
      .from('products')
      .update({
        status: 'live',
        shopee_item_id: result.item_id,
        shopee_image_id: shopeeImageId,
        shopee_account_id: account.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)

    await service.from('upload_logs').insert({
      user_id: user.id,
      product_id: productId,
      action: 'create_product',
      status: 'success',
      response_payload: result,
    })

    return NextResponse.json({ success: true, item_id: result.item_id })
  } catch (err) {
    console.error('Product upload error:', err)
    const msg = err instanceof Error ? err.message : 'Upload failed'

    if (productId) {
      await service.from('products').update({ status: 'failed' }).eq('id', productId)
      await service.from('upload_logs').insert({
        user_id: user.id,
        product_id: productId,
        action: 'create_product',
        status: 'failed',
        error_message: msg,
      })
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
