import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Alert from '../components/Alert'
import { fetchAnalytics, getErrorMessage, type Analytics } from '../api/client'

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAnalytics()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
  }, [])

  return (
    <Layout title="Analytics" description="Insights into your translation patterns">
      {error && <Alert type="error" message={error} />}

      {!data ? (
        <div className="card text-slate-400">Loading analytics...</div>
      ) : data.total_translations === 0 ? (
        <div className="card text-center text-slate-400">No analytics data yet.</div>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="card">
              <p className="text-sm text-slate-400">Total Translations</p>
              <p className="text-3xl font-bold text-white">{data.total_translations}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-400">Favorites</p>
              <p className="text-3xl font-bold text-white">{data.total_favorites}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-400">Most Used Language</p>
              <p className="text-3xl font-bold text-white">{data.most_used_language || '—'}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h2 className="mb-4 font-semibold text-white">By Target Language</h2>
              <ul className="space-y-2">
                {Object.entries(data.translations_by_language).map(([lang, count]) => (
                  <li key={lang} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{lang}</span>
                    <span className="rounded-full bg-blue-600/20 px-2 py-0.5 text-blue-300">{count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h2 className="mb-4 font-semibold text-white">By Mode</h2>
              <ul className="space-y-2">
                {Object.entries(data.translations_by_mode).map(([mode, count]) => (
                  <li key={mode} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-slate-300">{mode}</span>
                    <span className="rounded-full bg-violet-600/20 px-2 py-0.5 text-violet-300">{count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card lg:col-span-2">
              <h2 className="mb-4 font-semibold text-white">Daily Activity</h2>
              <ul className="space-y-2">
                {Object.entries(data.daily_counts).map(([day, count]) => (
                  <li key={day} className="flex items-center gap-4 text-sm">
                    <span className="w-28 text-slate-400">{day}</span>
                    <div className="h-2 flex-1 rounded-full bg-surface-900">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                        style={{
                          width: `${Math.min(100, (count / Math.max(...Object.values(data.daily_counts))) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-slate-300">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}
