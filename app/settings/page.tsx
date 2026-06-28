import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import type { ShopeeAccount } from '@/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accounts } = await supabase
    .from('shopee_accounts')
    .select('*')
    .eq('user_id', user.id)

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
            <div className="space-y-3">
              <Row label="Email" value={user.email ?? '—'} />
              <Row label="User ID" value={user.id} mono />
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shopee Accounts</h2>
            {accounts && accounts.length > 0 ? (
              <div className="space-y-3">
                {(accounts as ShopeeAccount[]).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.shop_name}</p>
                      <p className="text-xs text-gray-500">Shop ID: {a.shop_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Token expires</p>
                      <p className="text-xs font-medium text-gray-600">
                        {new Date(a.token_expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No Shopee accounts connected.</p>
            )}
          </section>

          <section className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">API Configuration</h2>
            <p className="text-sm text-gray-500 mb-4">Managed via server environment variables.</p>
            <div className="space-y-2">
              {[
                'SHOPEE_PARTNER_ID',
                'SHOPEE_PARTNER_KEY',
                'SHOPEE_REDIRECT_URL',
                'OPENAI_API_KEY',
                'NEXT_PUBLIC_SUPABASE_URL',
              ].map((k) => (
                <div
                  key={k}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <span className="text-sm text-gray-600">{k}</span>
                  <span className="text-xs font-mono bg-gray-50 px-2 py-1 rounded text-gray-400">
                    env var
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-sm mt-0.5 ${mono ? 'font-mono text-gray-400' : 'font-medium text-gray-900'}`}>
        {value}
      </p>
    </div>
  )
}
