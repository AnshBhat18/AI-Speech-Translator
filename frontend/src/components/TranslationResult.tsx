import { useEffect, useState } from 'react'
import { Loader2, Volume2 } from 'lucide-react'
import { textToSpeech } from '../api/client'

interface TranslationResultProps {
  original: string
  translated: string
  targetLanguage: string
  onFavorite?: () => void
  favoriteLoading?: boolean
}

export default function TranslationResult({
  original,
  translated,
  targetLanguage,
  onFavorite,
  favoriteLoading,
}: TranslationResultProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [ttsLoading, setTtsLoading] = useState(false)

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const handleSpeak = async () => {
    setTtsLoading(true)
    try {
      const url = await textToSpeech(translated, targetLanguage)
      setAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })
    } finally {
      setTtsLoading(false)
    }
  }

  return (
    <div className="card space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Original</p>
        <p className="mt-1 text-slate-200">{original}</p>
      </div>
      <div className="border-t border-slate-700 pt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-blue-400">Translation</p>
        <p className="mt-1 text-lg text-white">{translated}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handleSpeak} className="btn-secondary" disabled={ttsLoading}>
          {ttsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Volume2 className="h-4 w-4" aria-hidden />
          )}
          Listen
        </button>
        {onFavorite && (
          <button type="button" onClick={onFavorite} className="btn-secondary" disabled={favoriteLoading}>
            {favoriteLoading ? 'Saving...' : 'Add to favorites'}
          </button>
        )}
      </div>
      {audioUrl && (
        <audio controls src={audioUrl} className="w-full" aria-label="Translated speech playback">
          Your browser does not support audio playback.
        </audio>
      )}
    </div>
  )
}
