import { useEffect, useState } from 'react'
import { Award, BookOpen, ChevronLeft, ChevronRight, Loader2, RotateCcw, Trash2, Volume2 } from 'lucide-react'
import Layout from '../components/Layout'
import Alert from '../components/Alert'
import {
  fetchFavorites,
  getErrorMessage,
  removeFavorite,
  textToSpeech,
  type FavoriteEntry,
} from '../api/client'

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Flashcards Study Mode State
  const [studyMode, setStudyMode] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [ttsLoading, setTtsLoading] = useState(false)
  const [learnedCount, setLearnedCount] = useState(0)
  const [sessionCards, setSessionCards] = useState<FavoriteEntry[]>([])

  const load = () => {
    fetchFavorites()
      .then(setFavorites)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleRemove = async (id: number) => {
    try {
      await removeFavorite(id)
      setFavorites((prev) => prev.filter((f) => f.id !== id))
      setSessionCards((prev) => prev.filter((f) => f.id !== id))
      if (currentIndex >= favorites.length - 1 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const startStudy = () => {
    if (favorites.length === 0) return
    setSessionCards([...favorites])
    setCurrentIndex(0)
    setFlipped(false)
    setLearnedCount(0)
    setStudyMode(true)
  }

  const playTranslationSpeech = async (text: string, lang: string) => {
    setTtsLoading(true)
    try {
      const url = await textToSpeech(text, lang)
      const audio = new Audio(url)
      await audio.play()
    } catch (err) {
      setError('Text-to-speech playback failed.')
    } finally {
      setTtsLoading(false)
    }
  }

  const handleMarkLearned = () => {
    setLearnedCount((prev) => prev + 1)
    // Remove the current card from active study list
    const updated = [...sessionCards]
    updated.splice(currentIndex, 1)
    setSessionCards(updated)

    setFlipped(false)
    if (currentIndex >= updated.length && updated.length > 0) {
      setCurrentIndex(updated.length - 1)
    }
  }

  if (studyMode) {
    const hasCards = sessionCards.length > 0
    const currentCard = hasCards ? sessionCards[currentIndex] : null

    return (
      <Layout title="Flashcard Quiz" description="Review and memorize your saved favorites">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStudyMode(false)}
            className="btn-secondary"
          >
            Exit Study Mode
          </button>
          {hasCards && (
            <div className="text-sm font-semibold text-slate-400">
              Card {currentIndex + 1} of {sessionCards.length}
            </div>
          )}
        </div>

        {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

        {!hasCards ? (
          <div className="card max-w-lg mx-auto text-center py-12 space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400">
              <Award className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Quiz Completed!</h3>
              <p className="mt-2 text-sm text-slate-400">
                You successfully reviewed and mastered {learnedCount} flashcards in this session.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSessionCards([...favorites])
                setCurrentIndex(0)
                setFlipped(false)
                setLearnedCount(0)
              }}
              className="btn-primary inline-flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restart Session
            </button>
          </div>
        ) : (
          currentCard && (
            <div className="mx-auto max-w-xl space-y-6">
              {/* Card Container with Perspective */}
              <div
                onClick={() => setFlipped(!flipped)}
                className="flashcard-container h-80 w-full cursor-pointer"
              >
                <div className={`flashcard-inner h-full w-full preserve-3d ${flipped ? 'flipped' : ''}`}>
                  
                  {/* Front Side */}
                  <div className="flashcard-front card flex flex-col justify-between border-slate-700 bg-surface-800 p-8 shadow-2xl hover:border-blue-500/50">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Original Text
                    </div>
                    <div className="text-center text-xl font-semibold text-white px-4 leading-normal flex-1 flex items-center justify-center">
                      {currentCard.original}
                    </div>
                    <div className="text-center text-xs text-slate-400">
                      Click to flip and reveal translation
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="flashcard-back card flex flex-col justify-between border-slate-700 bg-surface-800 p-8 shadow-2xl hover:border-blue-500/50">
                    <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
                      Translation ({currentCard.target_language})
                    </div>
                    <div className="text-center text-xl font-semibold text-white px-4 leading-normal flex-1 flex items-center justify-center">
                      {currentCard.translated}
                    </div>
                    <div className="text-center text-xs text-slate-400">
                      Click to show original
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation() // Prevent flipping back
                        playTranslationSpeech(currentCard.translated, currentCard.target_language)
                      }}
                      disabled={ttsLoading}
                      className="absolute right-6 bottom-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg transition hover:bg-blue-500 disabled:opacity-50"
                      aria-label="Listen translation"
                    >
                      {ttsLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                </div>
              </div>


              {/* Quiz Navigation */}
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setFlipped(false)
                    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : sessionCards.length - 1))
                  }}
                  className="btn-secondary flex-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>

                <button
                  type="button"
                  onClick={handleMarkLearned}
                  className="btn-primary flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/20"
                >
                  Mark as Learned
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFlipped(false)
                    setCurrentIndex((prev) => (prev < sessionCards.length - 1 ? prev + 1 : 0))
                  }}
                  className="btn-secondary flex-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        )}
      </Layout>
    )
  }

  return (
    <Layout title="Favorites" description="Your saved translations">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-sm font-medium text-slate-400">
          Saved Favorites ({favorites.length})
        </h2>
        {favorites.length > 0 && (
          <button
            type="button"
            onClick={startStudy}
            className="btn-primary flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Study Flashcards
          </button>
        )}
      </div>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      {loading ? (
        <div className="card text-slate-400">Loading favorites...</div>
      ) : favorites.length === 0 ? (
        <div className="card text-center text-slate-400">
          No favorites yet. Save translations from the text translation page.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {favorites.map((item) => (
            <div key={item.id} className="card relative">
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="absolute right-4 top-4 text-slate-500 hover:text-red-400"
                aria-label="Remove favorite"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <p className="pr-8 font-medium text-slate-200">{item.original}</p>
              <p className="mt-2 text-blue-300">{item.translated}</p>
              <p className="mt-3 text-xs text-slate-500">
                {item.target_language} · {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}

