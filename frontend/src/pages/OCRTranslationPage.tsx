import { FormEvent, useEffect, useState } from 'react'
import { ImageIcon, Loader2 } from 'lucide-react'
import Layout from '../components/Layout'
import LanguageSelect from '../components/LanguageSelect'
import TranslationResult from '../components/TranslationResult'
import Alert from '../components/Alert'
import {
  fetchLanguages,
  getErrorMessage,
  translateOCR,
  type Language,
} from '../api/client'

export default function OCRTranslationPage() {
  const [languages, setLanguages] = useState<Language[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [target, setTarget] = useState('English')
  const [original, setOriginal] = useState('')
  const [translated, setTranslated] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchLanguages().then(setLanguages).catch(() => setError('Failed to load languages'))
  }, [])

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) return
    setError('')
    setLoading(true)

    try {
      const data = await translateOCR(file, target)
      setOriginal(data.original)
      setTranslated(data.translated)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout
      title="OCR Translation"
      description="Extract text from images and translate automatically"
    >
      <div className="card mb-4 max-w-2xl border-amber-500/20 bg-amber-500/5 text-sm text-amber-200">
        Requires Tesseract OCR installed on the server. Supported formats: PNG, JPG, JPEG, WEBP.
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl space-y-4">
        <div>
          <label htmlFor="image-upload" className="label">
            Image with text
          </label>
          <label
            htmlFor="image-upload"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-600 bg-surface-900 px-6 py-8 transition hover:border-blue-500/50"
          >
            {preview ? (
              <img src={preview} alt="Upload preview" className="max-h-48 rounded-lg object-contain" />
            ) : (
              <>
                <ImageIcon className="mb-3 h-8 w-8 text-slate-500" aria-hidden />
                <span className="text-sm text-slate-400">Click to upload an image</span>
              </>
            )}
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <LanguageSelect languages={languages} value={target} onChange={setTarget} />

        <button type="submit" className="btn-primary" disabled={!file || loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Extract & Translate
        </button>
      </form>

      {error && <div className="mt-4"><Alert type="error" message={error} /></div>}

      {translated && (
        <div className="mt-6 max-w-3xl">
          <TranslationResult
            original={original}
            translated={translated}
            targetLanguage={target}
          />
        </div>
      )}
    </Layout>
  )
}
