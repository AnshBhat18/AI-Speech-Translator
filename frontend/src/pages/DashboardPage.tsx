import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Languages, Mic, Star, TrendingUp } from 'lucide-react'
import Layout from '../components/Layout'
import { fetchAnalytics, fetchHistory, type HistoryEntry } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { isAuthenticated } = useAuth()
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [stats, setStats] = useState({ total: 0, favorites: 0, mostUsed: '—' })

  useEffect(() => {
    Promise.all([fetchHistory(), fetchAnalytics()])
      .then(([hist, analytics]) => {
        setHistory(hist.slice(0, 5))
        setStats({
          total: analytics.total_translations,
          favorites: analytics.total_favorites,
          mostUsed: analytics.most_used_language || '—',
        })
      })
      .catch(() => {})
  }, [])

  const quickLinks = [
    { to: '/text', label: 'Text Translation', icon: Languages, desc: 'Translate written text instantly' },
    { to: '/speech', label: 'Speech Translation', icon: Mic, desc: 'Upload audio and get translations' },
    { to: '/ocr', label: 'OCR Translation', icon: TrendingUp, desc: 'Extract and translate image text' },
  ]

  return (
    <Layout
      title="Dashboard"
      description="Overview of your translation activity and quick actions"
    >
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Translations', value: stats.total, icon: Languages },
          { label: 'Favorites', value: stats.favorites, icon: Star },
          { label: 'Most Used Language', value: stats.mostUsed, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20">
              <Icon className="h-6 w-6 text-blue-400" aria-hidden />
            </div>
            <div>
              <p className="text-sm text-slate-400">{label}</p>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {!isAuthenticated && (
        <div className="card mb-8 border-blue-500/30 bg-blue-500/5">
          <p className="text-slate-300">
            <Link to="/login" className="font-semibold text-blue-400 hover:underline">
              Sign in
            </Link>{' '}
            to save favorites and sync your translation history across sessions.
          </p>
        </div>
      )}

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-white">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickLinks.map(({ to, label, icon: Icon, desc }) => (
            <Link
              key={to}
              to={to}
              className="card group flex flex-col transition hover:border-blue-500/40 hover:bg-surface-700/50"
            >
              <Icon className="mb-3 h-6 w-6 text-blue-400" aria-hidden />
              <h3 className="font-semibold text-white group-hover:text-blue-300">{label}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-400">{desc}</p>
              <ArrowRight className="mt-3 h-4 w-4 text-slate-500 group-hover:text-blue-400" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Recent Translations</h2>
        {history.length === 0 ? (
          <div className="card text-center text-slate-400">
            No translations yet. Start with text or speech translation.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="card">
                <p className="font-medium text-slate-200">{item.original}</p>
                <p className="mt-1 text-blue-300">{item.translated}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {item.mode} · {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  )
}
