import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import type { ShopeeAccount } from '@/types'

export default async function ConnectShopeePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accounts } = await supabase
    .from('shopee_accounts')
    .select('*')
    .eq('user_id', user.id)

  const params = await searchParams

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect Shopee Account</h1>
        <p className="text-gray-500 mb-8">
          Link your Shopee seller account to enable product uploads.
        </p>

        {params.success && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm">
            Shopee account connected successfully!
          </div>
        )}
        {params.error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            Error: {decodeURIComponent(params.error)}
          </div>
        )}

        {accounts && accounts.length > 0 && (
          <div className="space-y-3 mb-6">
            {(accounts as ShopeeAccount[]).map((account) => (
              <div
                key={account.id}
                className="p-5 rounded-xl bg-white border border-gray-100 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="font-medium text-gray-900">{account.shop_name}</p>
                  </div>
                  <p className="text-sm text-gray-500">Shop ID: {account.shop_id}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Token expires: {new Date(account.token_expires_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <Link
          href="/api/shopee/auth"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#EE4D2D] text-white font-medium rounded-xl hover:bg-[#D73211] transition-colors"
        >
          {accounts && accounts.length > 0 ? 'Connect another account' : 'Connect Shopee Account'}
        </Link>

        <div className="mt-8 p-5 rounded-xl bg-gray-50 border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">How it works</h3>
          <ol className="text-sm text-gray-500 space-y-1.5 list-decimal list-inside">
            <li>Click “Connect Shopee Account” above</li>
            <li>Log in to your Shopee seller account</li>
            <li>Authorize this app to manage your products</li>
            <li>You’ll be redirected back here automatically</li>
          </ol>
        </div>
      </main>
    </>
  )
}
