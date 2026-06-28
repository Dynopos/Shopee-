import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
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
      .limit(10),
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
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your AI-generated Shopee listings</p>
        </div>

        {!shop ? (
          <div className="mb-6 p-4 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-between">
            <div>
              <p className="font-medium text-orange-800">Connect your Shopee account</p>
              <p className="text-sm text-orange-600 mt-0.5">
                Required before you can upload products.
              </p>
            </div>
            <Link
              href="/connect-shopee"
              className="px-4 py-2 bg-[#EE4D2D] text-white text-sm font-medium rounded-lg hover:bg-[#D73211] transition-colors"
            >
              Connect now
            </Link>
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700">
              Connected to{' '}
              <span className="font-medium">{shop.shop_name}</span> (Shop ID:{' '}
              {shop.shop_id})
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, cls: 'text-gray-900 bg-white' },
            { label: 'Live', value: stats.live, cls: 'text-green-700 bg-green-50' },
            { label: 'Draft', value: stats.draft, cls: 'text-yellow-700 bg-yellow-50' },
            { label: 'Failed', value: stats.failed, cls: 'text-red-700 bg-red-50' },
          ].map((s) => (
            <div key={s.label} className={`${s.cls} rounded-xl border border-gray-100 p-4`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Products</h2>
          <Link
            href="/upload"
            className="px-4 py-2 bg-[#EE4D2D] text-white text-sm font-medium rounded-lg hover:bg-[#D73211] transition-colors"
          >
            + New listing
          </Link>
        </div>

        {!products?.length ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-400 mb-4">No products yet.</p>
            <Link
              href="/upload"
              className="px-4 py-2 bg-[#EE4D2D] text-white text-sm font-medium rounded-lg hover:bg-[#D73211] transition-colors"
            >
              Upload first product
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Product', 'Price (IDR)', 'Status', 'Date'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(products as Product[]).map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">
                      {p.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.price?.toLocaleString('id-ID') ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    live: 'bg-green-100 text-green-700',
    draft: 'bg-yellow-100 text-yellow-700',
    uploading: 'bg-blue-100 text-blue-700',
    failed: 'bg-red-100 text-red-700',
  }
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
        map[status] ?? 'bg-gray-100 text-gray-700'
      }`}
    >
      {status}
    </span>
  )
}
