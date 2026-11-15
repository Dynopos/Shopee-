'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import type { ListingFormData } from '@/types'

export default function PreviewPage() {
  const [listing, setListing] = useState<ListingFormData | null>(null)
  const [productId, setProductId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedItemId, setUploadedItemId] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const draft = sessionStorage.getItem('listing_draft')
    const pid = sessionStorage.getItem('listing_product_id')
    if (!draft) {
      router.push('/upload')
      return
    }
    setListing(JSON.parse(draft))
    setProductId(pid)
  }, [router])

  function set<K extends keyof ListingFormData>(key: K, value: ListingFormData[K]) {
    setListing((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function handleUpload() {
    if (!listing || !productId) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/products/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, listing }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Muat naik gagal')

      sessionStorage.removeItem('listing_draft')
      sessionStorage.removeItem('listing_product_id')
      setUploadedItemId(data.item_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Muat naik gagal')
    } finally {
      setLoading(false)
    }
  }

  if (!listing) return null

  if (uploadedItemId) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Produk Berjaya Dimuat Naik!</h2>
            <p className="text-gray-400 text-sm mb-1">Shopee Item ID:</p>
            <p className="font-mono font-bold text-gray-900 text-lg mb-8">{uploadedItemId}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/upload')}
                className="px-6 py-3 bg-[#2563EB] text-white rounded-xl hover:bg-[#1D4ED8] transition-colors font-semibold"
              >
                Hantar Produk Lain
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="bg-white border-b border-gray-100 px-8 py-4 sticky top-0 z-10 flex items-center gap-3">
        <button
          onClick={() => router.push('/upload')}
          className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors text-sm"
        >
          ←
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Semak & Edit Listing</h1>
          <p className="text-xs text-gray-400">Jana oleh AI — semak sebelum muat naik</p>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column */}
          <div className="space-y-4">
            {listing.imageUrl && (
              <div className="bg-white rounded-2xl border border-gray-100 p-3">
                <img
                  src={listing.imageUrl}
                  alt="Produk"
                  className="w-full rounded-xl object-contain max-h-56"
                />
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <Field label="Harga (MYR)">
                <input
                  type="number"
                  value={listing.price}
                  onChange={(e) => set('price', Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field label="Stok">
                <input
                  type="number"
                  value={listing.stock}
                  onChange={(e) => set('stock', Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field label="Kategori">
                <input
                  type="text"
                  value={listing.category}
                  onChange={(e) => set('category', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <Field label={`Tajuk Produk (${listing.title.length}/120)`}>
                <input
                  type="text"
                  value={listing.title}
                  onChange={(e) => set('title', e.target.value)}
                  maxLength={120}
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <Field label="Penerangan">
                <textarea
                  value={listing.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={5}
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Kata Kunci SEO
              </p>
              <div className="flex flex-wrap gap-2">
                {listing.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                  >
                    {kw}
                    <button
                      onClick={() =>
                        set(
                          'keywords',
                          listing.keywords.filter((_, j) => j !== i)
                        )
                      }
                      className="hover:text-red-500 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Keistimewaan Produk
              </p>
              <ul className="space-y-2">
                {listing.highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-green-500 text-xs font-bold">✓</span>
                    <input
                      type="text"
                      value={h}
                      onChange={(e) => {
                        const updated = [...listing.highlights]
                        updated[i] = e.target.value
                        set('highlights', updated)
                      }}
                      className={`flex-1 ${inputCls}`}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            <p className="font-semibold">Muat naik gagal</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-gray-400">Semak semua maklumat sebelum muat naik.</p>
          <button
            onClick={handleUpload}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            {loading ? (
              <>
                <Spinner />
                Memuat naik ke Shopee…
              </>
            ) : (
              'Muat Naik ke Shopee'
            )}
          </button>
        </div>
      </div>
    </AppShell>
  )
}

const inputCls =
  'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</p>
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
