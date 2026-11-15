import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
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
    <AppShell>
      <div className="bg-white border-b border-gray-100 px-8 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900">Sambung Akaun Shopee</h1>
        <p className="text-xs text-gray-400">Hubungkan akaun penjual Shopee anda</p>
      </div>

      <div className="p-8 max-w-2xl">
        {params.success && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm">
            Akaun Shopee berjaya disambungkan!
          </div>
        )}
        {params.error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            Ralat: {decodeURIComponent(params.error)}
          </div>
        )}

        {accounts && accounts.length > 0 && (
          <div className="space-y-3 mb-6">
            {(accounts as ShopeeAccount[]).map((account) => (
              <div
                key={account.id}
                className="p-5 rounded-2xl bg-white border border-gray-100 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="font-semibold text-gray-900 text-sm">{account.shop_name}</p>
                  </div>
                  <p className="text-xs text-gray-400">Shop ID: {account.shop_id}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Token tamat: {new Date(account.token_expires_at).toLocaleDateString('ms-MY')}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  Aktif
                </span>
              </div>
            ))}
          </div>
        )}

        <Link
          href="/api/shopee/auth"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-xl hover:bg-[#1D4ED8] transition-colors text-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>
          {accounts && accounts.length > 0 ? 'Sambung Akaun Lain' : 'Sambung Akaun Shopee'}
        </Link>

        <div className="mt-8 p-6 rounded-2xl bg-white border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Cara Sambung</h3>
          <ol className="space-y-3">
            {[
              'Klik butang "Sambung Akaun Shopee" di atas',
              'Log masuk ke akaun penjual Shopee anda',
              'Benarkan akses aplikasi untuk urus produk anda',
              'Anda akan diarahkan kembali ke sini secara automatik',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="min-w-[22px] h-[22px] rounded-full bg-[#2563EB] text-white text-[11px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-gray-500">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </AppShell>
  )
}
