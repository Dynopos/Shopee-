import { NextRequest, NextResponse } from 'next/server'
import { refreshAccessToken } from '@/lib/shopee/client'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { shop_id } = await request.json()
    const service = createServiceClient()

    const { data: account, error } = await service
      .from('shopee_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('shop_id', shop_id)
      .single()

    if (error || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const tokenData = await refreshAccessToken(account.refresh_token, shop_id)
    const expiresAt = new Date(Date.now() + tokenData.expire_in * 1000).toISOString()

    await service
      .from('shopee_accounts')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', account.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Refresh failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
