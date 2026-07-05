import { FormEvent, useEffect, useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import Layout from '../components/Layout'
import LanguageSelect from '../components/LanguageSelect'
import TranslationResult from '../components/TranslationResult'
import Alert from '../components/Alert'
import {
  fetchLanguages,
  getErrorMessage,
  translateFile,
  type Language,
} from '../api/client'

export default function FileTranslationPage() {
  const [languages, setLanguages] = useState<Language[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [target, setTarget] = useState('French')
  const [original, setOriginal] = useState('')
  const [translated, setTranslated] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchLanguages().then(setLanguages).catch(() => setError('Failed to load languages'))
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) return
    setError('')
    setLoading(true)

    try {
      const data = await translateFile(file, target)
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
      title="File Translation"
      description="Upload TXT, DOCX, or PDF files for translation"
    >
      <form onSubmit={handleSubmit} className="card max-w-2xl space-y-4">
        <div>
          <label htmlFor="file-upload" className="label">
            Document file
          </label>
          <label
            htmlFor="file-upload"
            className="flex cursor-pointer items-center gap-4 rounded-xl border border-slate-600 bg-surface-900 px-4 py-4 transition hover:border-blue-500/50"
          >
            <FileText className="h-8 w-8 text-blue-400" aria-hidden />
            <span className="text-sm text-slate-400">
              {file ? file.name : 'Select .txt, .docx, or .pdf file'}
            </span>
            <input
              id="file-upload"
              type="file"
              accept=".txt,.docx,.pdf"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <LanguageSelect languages={languages} value={target} onChange={setTarget} />

        <button type="submit" className="btn-primary" disabled={!file || loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Translate File
        </button>
      </form>

      {error && <div className="mt-4"><Alert type="error" message={error} /></div>}

      {translated && (
        <div className="mt-6 max-w-3xl">
          <TranslationResult
            original={original.slice(0, 500) + (original.length > 500 ? '...' : '')}
            translated={translated}
            targetLanguage={target}
          />
        </div>
      )}
    </Layout>
  )
}
