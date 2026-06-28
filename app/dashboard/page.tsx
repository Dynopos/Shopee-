import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import type { Product, ShopeeAccount } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: products }, { data: accounts }] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('shopee_accounts').select('*').eq('user_id', user.id).limit(1),
  ])

  const shop = accounts?.[0] as ShopeeAccount | undefined

  const stats = {
    total: products?.length ?? 0,
    live: products?.filter((p: Product) => p.status === 'live').length ?? 0,
    draft: products?.filter((p: Product) => p.status === 'draft').length ?? 0,
    failed: products?.filter((p: Product) => p.status === 'failed').length ?? 0,
  }

  return (
    <AppShell>
      {/* Topbar */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-400">Selamat datang semula!</p>
        </div>
        <Link
          href="/upload"
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Listing Baru
        </Link>
      </div>

      <div className="p-8">
        {/* Connect banner */}
        {!shop ? (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-amber-800 text-sm">Sambung akaun Shopee anda</p>
              <p className="text-xs text-amber-600 mt-0.5">Diperlukan sebelum produk boleh dimuat naik.</p>
            </div>
            <Link
              href="/connect-shopee"
              className="px-4 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-xl hover:bg-[#1D4ED8] transition-colors whitespace-nowrap"
            >
              Sambung Sekarang
            </Link>
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-100 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700">
              Disambung ke <span className="font-semibold">{shop.shop_name}</span>{' '}
              <span className="text-green-500">(ID: {shop.shop_id})</span>
            </p>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Jumlah Produk" value={stats.total} gradient="from-[#9B1C1C] to-[#DC2626]" />
          <StatCard label="Aktif (Live)" value={stats.live} gradient="from-[#2563EB] to-[#1D4ED8]" />
          <StatCard label="Draf" value={stats.draft} gradient="from-[#0F172A] to-[#1E293B]" />
          <StatCard label="Gagal" value={stats.failed} gradient="from-[#6B7280] to-[#4B5563]" />
        </div>

        {/* Products table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Sejarah Listing Produk</h2>
            <span className="text-xs text-gray-400">{stats.total} produk</span>
          </div>

          {!products?.length ? (
            <div className="text-center py-16">
              <p className="text-gray-400 mb-4 text-sm">Tiada produk lagi.</p>
              <Link
                href="/upload"
                className="inline-flex px-4 py-2 bg-[#2563EB] text-white text-sm font-semibold rounded-xl hover:bg-[#1D4ED8] transition-colors"
              >
                Muat Naik Produk Pertama
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Nama Produk', 'Harga (MYR)', 'Status', 'Tarikh', 'Tindakan'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(products as Product[]).map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900 max-w-xs truncate">
                      {p.title}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {p.price ? `RM ${Number(p.price).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-400">
                      {new Date(p.created_at).toLocaleDateString('ms-MY')}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href="/upload"
                        className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                      >
                        Edit & Hantar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function StatCard({
  label,
  value,
  gradient,
}: {
  label: string
  value: number
  gradient: string
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 flex flex-col justify-between min-h-[110px]`}>
      <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-white mt-2">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    live: 'bg-green-100 text-green-700',
    draft: 'bg-yellow-100 text-yellow-700',
    uploading: 'bg-blue-100 text-blue-700',
    failed: 'bg-red-100 text-red-700',
  }
  const labels: Record<string, string> = {
    live: 'Aktif',
    draft: 'Draf',
    uploading: 'Memuat naik…',
    failed: 'Gagal',
  }
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
        map[status] ?? 'bg-gray-100 text-gray-700'
      }`}
    >
      {labels[status] ?? status}
    </span>
  )
}
