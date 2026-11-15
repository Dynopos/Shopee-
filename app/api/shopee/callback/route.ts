import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken } from '@/lib/shopee/client'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const shopId = searchParams.get('shop_id')

  if (!code || !shopId) {
    return NextResponse.redirect(
      new URL('/connect-shopee?error=missing_params', request.url)
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/login', request.url))

    const tokenData = await exchangeCodeForToken(code, parseInt(shopId))
    const expiresAt = new Date(Date.now() + tokenData.expire_in * 1000).toISOString()

    const service = createServiceClient()
    const { error } = await service.from('shopee_accounts').upsert(
      {
        user_id: user.id,
        shop_id: tokenData.shop_id,
        // Fetch real shop name via v2.shop.get_shop_info after connecting
        shop_name: `Shop ${tokenData.shop_id}`,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,shop_id' }
    )

    if (error) throw error

    return NextResponse.redirect(new URL('/connect-shopee?success=true', request.url))
  } catch (err) {
    console.error('Shopee callback error:', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.redirect(
      new URL(`/connect-shopee?error=${encodeURIComponent(msg)}`, request.url)
    )
  }
}
