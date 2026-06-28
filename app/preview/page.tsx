'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
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
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      sessionStorage.removeItem('listing_draft')
      sessionStorage.removeItem('listing_product_id')
      setUploadedItemId(data.item_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  if (!listing) return null

  if (uploadedItemId) {
    return (
      <>
        <Navbar />
        <main className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product live on Shopee!</h2>
          <p className="text-gray-500 mb-1">
            Shopee Item ID:{' '}
            <span className="font-mono font-medium text-gray-900">{uploadedItemId}</span>
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => router.push('/upload')}
              className="px-6 py-2.5 bg-[#EE4D2D] text-white rounded-xl hover:bg-[#D73211] transition-colors"
            >
              List another product
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Back to dashboard
            </button>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/upload')}
            className="text-gray-400 hover:text-gray-600"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Review & Edit Listing</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Left column */}
          <div className="md:col-span-1 space-y-4">
            {listing.imageUrl && (
              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <img
                  src={listing.imageUrl}
                  alt="Product"
                  className="w-full rounded-lg object-contain max-h-56"
                />
              </div>
            )}
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <Field label="Price (IDR)">
                <input
                  type="number"
                  value={listing.price}
                  onChange={(e) => set('price', Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field label="Stock">
                <input
                  type="number"
                  value={listing.stock}
                  onChange={(e) => set('stock', Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field label="Category">
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
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <Field label={`Title (${listing.title.length}/120)`}>
                <input
                  type="text"
                  value={listing.title}
                  onChange={(e) => set('title', e.target.value)}
                  maxLength={120}
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <Field label="Description">
                <textarea
                  value={listing.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={5}
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                SEO Keywords
              </p>
              <div className="flex flex-wrap gap-2">
                {listing.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium"
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

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Highlights
              </p>
              <ul className="space-y-2">
                {listing.highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-green-500 text-xs">✓</span>
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
            <p className="font-medium">Upload failed</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-gray-400">Review all fields before uploading.</p>
          <button
            onClick={handleUpload}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-[#EE4D2D] hover:bg-[#D73211] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
          >
            {loading ? (
              <>
                <Spinner />
                Uploading to Shopee…
              </>
            ) : (
              'Upload to Shopee'
            )}
          </button>
        </div>
      </main>
    </>
  )
}

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</p>
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
