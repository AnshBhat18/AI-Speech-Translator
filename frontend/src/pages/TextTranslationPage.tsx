import { FormEvent, useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import Layout from '../components/Layout'
import LanguageSelect from '../components/LanguageSelect'
import TranslationResult from '../components/TranslationResult'
import Alert from '../components/Alert'
import {
  addFavorite,
  fetchLanguages,
  getErrorMessage,
  translateBatch,
  translateText,
  translateMulti,
  type Language,
  type TranslateResult,
  type MultiTranslateResult,
} from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function TextTranslationPage() {
  const { isAuthenticated } = useAuth()
  const [languages, setLanguages] = useState<Language[]>([])
  const [text, setText] = useState('')
  const [batchText, setBatchText] = useState('')
  const [target, setTarget] = useState('French')
  
  // Multi-Target Translation State
  const [multiTargets, setMultiTargets] = useState<string[]>(['French', 'Spanish'])
  const [multiResult, setMultiResult] = useState<MultiTranslateResult | null>(null)

  const [result, setResult] = useState<TranslateResult | null>(null)
  const [batchResults, setBatchResults] = useState<TranslateResult[]>([])
  const [loading, setLoading] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'single' | 'batch' | 'multi'>('single')

  useEffect(() => {
    fetchLanguages().then(setLanguages).catch(() => setError('Failed to load languages'))
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setResult(null)
    setBatchResults([])
    setMultiResult(null)

    try {
      if (mode === 'single') {
        const data = await translateText(text, target)
        setResult(data)
      } else if (mode === 'batch') {
        const lines = batchText.split('\n').map((l) => l.trim()).filter(Boolean)
        const data = await translateBatch(lines, target)
        setBatchResults(data)
      } else {
        if (multiTargets.length === 0) {
          setError('Please select at least one target language.')
          setLoading(false)
          return
        }
        const data = await translateMulti(text, multiTargets)
        setMultiResult(data)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleFavorite = async () => {
    if (!result || !isAuthenticated) return
    setFavoriteLoading(true)
    try {
      await addFavorite(result.original, result.translated, target)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setFavoriteLoading(false)
    }
  }

  const handleMultiFavorite = async (original: string, translated: string, targetLanguage: string) => {
    try {
      await addFavorite(original, translated, targetLanguage)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const toggleMultiTarget = (langName: string) => {
    setMultiTargets((prev) =>
      prev.includes(langName)
        ? prev.filter((l) => l !== langName)
        : prev.length < 5
        ? [...prev, langName]
        : prev
    )
  }

  return (
    <Layout
      title="Text Translation"
      description="Translate text, batch phrases, or translate to multiple target languages concurrently"
    >
      <div className="mb-6 flex gap-2">
        {(['single', 'batch', 'multi'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              mode === m ? 'bg-blue-600 text-white' : 'bg-surface-800 text-slate-400 hover:text-white'
            }`}
          >
            {m === 'single' ? 'Single' : m === 'batch' ? 'Batch (up to 20)' : 'Multi-Language'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="card max-w-3xl space-y-4">
        {mode === 'single' || mode === 'multi' ? (
          <div>
            <label htmlFor="text-input" className="label">
              Enter text
            </label>
            <textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              className="input-field resize-y"
              placeholder="Type or paste text to translate..."
              required
              aria-required
            />
          </div>
        ) : (
          <div>
            <label htmlFor="batch-input" className="label">
              Enter one phrase per line
            </label>
            <textarea
              id="batch-input"
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              rows={8}
              className="input-field resize-y font-mono text-sm"
              placeholder={'Hello\nGood morning\nThank you'}
              required
              aria-required
            />
          </div>
        )}

        {mode !== 'multi' ? (
          <LanguageSelect languages={languages} value={target} onChange={setTarget} />
        ) : (
          <div>
            <span className="label mb-3">Select Target Languages (up to 5)</span>
            <div className="flex flex-wrap gap-2 rounded-xl border border-slate-700 bg-surface-900 p-4">
              {languages.map((lang) => {
                const selected = multiTargets.includes(lang.name)
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => toggleMultiTarget(lang.name)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${
                      selected
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-surface-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {selected && <Check className="h-3 w-3" />}
                    {lang.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Translate
        </button>
      </form>

      {error && <div className="mt-4"><Alert type="error" message={error} /></div>}

      {result && (
        <div className="mt-6 max-w-3xl">
          <TranslationResult
            original={result.original}
            translated={result.translated}
            targetLanguage={target}
            onFavorite={isAuthenticated ? handleFavorite : undefined}
            favoriteLoading={favoriteLoading}
          />
        </div>
      )}

      {batchResults.length > 0 && (
        <div className="mt-6 max-w-3xl space-y-3">
          {batchResults.map((item, i) => (
            <TranslationResult
              key={i}
              original={item.original}
              translated={item.translated}
              targetLanguage={target}
            />
          ))}
        </div>
      )}

      {multiResult && (
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-400">Translations comparison</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(multiResult.translations).map(([langCode, transText]) => (
              <TranslationResult
                key={langCode}
                original={multiResult.original}
                translated={transText}
                targetLanguage={langCode}
                onFavorite={
                  isAuthenticated
                    ? () => handleMultiFavorite(multiResult.original, transText, langCode)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}

