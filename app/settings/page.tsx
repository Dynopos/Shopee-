import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
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
    <AppShell>
      <div className="bg-white border-b border-gray-100 px-8 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900">Tetapan</h1>
        <p className="text-xs text-gray-400">Urus akaun dan konfigurasi</p>
      </div>

      <div className="p-8 max-w-2xl space-y-5">
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Maklumat Akaun</h2>
          <div className="space-y-0 divide-y divide-gray-50">
            <Row label="Emel" value={user.email ?? '—'} />
            <Row label="User ID" value={user.id} mono />
            <Row label="Daftar Pada" value={new Date(user.created_at).toLocaleDateString('ms-MY')} />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Akaun Shopee</h2>
          {accounts && accounts.length > 0 ? (
            <div className="space-y-3">
              {(accounts as ShopeeAccount[]).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{a.shop_name}</p>
                    <p className="text-xs text-gray-400">Shop ID: {a.shop_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Token tamat</p>
                    <p className="text-xs font-semibold text-gray-600">
                      {new Date(a.token_expires_at).toLocaleDateString('ms-MY')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Tiada akaun Shopee disambungkan.</p>
          )}
          <Link
            href="/connect-shopee"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
          >
            Urus Sambungan →
          </Link>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Konfigurasi API</h2>
          <p className="text-sm text-gray-400 mb-4">
            Diuruskan melalui pemboleh ubah persekitaran pelayan.
          </p>
          <div className="space-y-0">
            {[
              'SHOPEE_PARTNER_ID',
              'SHOPEE_PARTNER_KEY',
              'SHOPEE_REDIRECT_URL',
              'OPENAI_API_KEY',
              'NEXT_PUBLIC_SUPABASE_URL',
            ].map((k) => (
              <div
                key={k}
                className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
              >
                <span className="text-sm text-gray-600">{k}</span>
                <span className="text-xs font-mono bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg text-gray-400">
                  env var
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p
        className={`text-sm text-right max-w-[60%] break-all ${
          mono ? 'font-mono text-gray-400 text-xs' : 'font-semibold text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
