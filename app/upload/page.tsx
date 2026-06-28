'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import Navbar from '@/components/layout/Navbar'
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
      const reason = rejected[0]?.errors[0]?.message ?? 'Invalid file'
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

      if (!res.ok) throw new Error(data.error || 'Generation failed')

      sessionStorage.setItem(
        'listing_draft',
        JSON.stringify({ ...data.listing, imageUrl: preview })
      )
      sessionStorage.setItem('listing_product_id', data.product_id)

      router.push('/preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Product Image</h1>
        <p className="text-gray-500 mb-8">
          Upload a clear photo and AI will generate the full listing for you.
        </p>

        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors',
            isDragActive && 'border-[#EE4D2D] bg-orange-50',
            !isDragActive && !file && 'border-gray-200 hover:border-gray-300 bg-white',
            file && 'border-green-300 bg-green-50'
          )}
        >
          <input {...getInputProps()} />
          {preview ? (
            <div className="space-y-3">
              <img
                src={preview}
                alt="Preview"
                className="max-h-60 mx-auto rounded-lg object-contain"
              />
              <p className="text-sm text-gray-500">
                {file?.name} &middot; {((file?.size ?? 0) / 1024).toFixed(0)} KB
              </p>
              <p className="text-xs text-gray-400">Click or drag to replace</p>
            </div>
          ) : (
            <div>
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              {isDragActive ? (
                <p className="text-[#EE4D2D] font-medium">Drop image here</p>
              ) : (
                <>
                  <p className="font-medium text-gray-700">Drag & drop or click to upload</p>
                  <p className="text-sm text-gray-400 mt-1">JPG, PNG, WebP — max 10 MB</p>
                </>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!file || loading}
          className="mt-6 w-full py-3 bg-[#EE4D2D] hover:bg-[#D73211] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Spinner />
              AI is analyzing your image…
            </>
          ) : (
            'Generate AI Listing'
          )}
        </button>
      </main>
    </>
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
