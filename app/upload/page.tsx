'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import AppShell from '@/components/layout/AppShell'
import { cn } from '@/lib/utils'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: (rejected) => {
      const reason = rejected[0]?.errors[0]?.message ?? 'Fail tidak sah'
      setError(reason)
    },
  })

  async function handleGenerate() {
    if (!file || !preview) return
    setLoading(true)
    setError(null)

    try {
      const form = new FormData()
      form.append('image', file)

      const res = await fetch('/api/ai/generate', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Penjanaan gagal')

      sessionStorage.setItem(
        'listing_draft',
        JSON.stringify({ ...data.listing, imageUrl: preview })
      )
      sessionStorage.setItem('listing_product_id', data.product_id)

      router.push('/preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ralat berlaku')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="bg-white border-b border-gray-100 px-8 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900">Muat Naik Gambar Produk</h1>
        <p className="text-xs text-gray-400">Muat naik gambar produk, AI akan jana listing lengkap</p>
      </div>

      <div className="p-8 max-w-xl">
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors',
            isDragActive && 'border-[#2563EB] bg-blue-50',
            !isDragActive && !file && 'border-gray-200 hover:border-gray-300 bg-white',
            file && 'border-green-300 bg-green-50'
          )}
        >
          <input {...getInputProps()} />
          {preview ? (
            <div className="space-y-3">
              <img
                src={preview}
                alt="Pratonton"
                className="max-h-60 mx-auto rounded-xl object-contain"
              />
              <p className="text-sm text-gray-500">
                {file?.name} &middot; {((file?.size ?? 0) / 1024).toFixed(0)} KB
              </p>
              <p className="text-xs text-gray-400">Klik atau seret untuk ganti</p>
            </div>
          ) : (
            <div>
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={1.5} className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              {isDragActive ? (
                <p className="text-[#2563EB] font-semibold">Lepaskan gambar di sini</p>
              ) : (
                <>
                  <p className="font-semibold text-gray-700">Seret & lepas atau klik untuk muat naik</p>
                  <p className="text-sm text-gray-400 mt-1">JPG, PNG, WebP — maks 10 MB</p>
                </>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!file || loading}
          className="mt-6 w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Spinner />
              AI sedang menganalisis gambar anda…
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
              Jana Listing AI
            </>
          )}
        </button>
      </div>
    </AppShell>
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
