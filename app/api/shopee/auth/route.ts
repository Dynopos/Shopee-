import { NextRequest, NextResponse } from 'next/server'
import { getAuthorizationUrl } from '@/lib/shopee/client'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const authUrl = getAuthorizationUrl()
  return NextResponse.redirect(authUrl)
}
