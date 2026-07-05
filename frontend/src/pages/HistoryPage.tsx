import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Alert from '../components/Alert'
import { fetchHistory, getErrorMessage, type HistoryEntry } from '../api/client'

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
      .then(setHistory)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  const exportCsv = () => {
    const header = 'Time,Mode,Source,Target,Original,Translated\n'
    const rows = history
      .map(
        (h) =>
          `"${h.created_at}","${h.mode}","${h.source_language}","${h.target_language}","${h.original.replace(/"/g, '""')}","${h.translated.replace(/"/g, '""')}"`,
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'translation_history.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Layout title="Translation History" description="View and export your past translations">
      {error && <Alert type="error" message={error} />}

      {!loading && history.length > 0 && (
        <div className="mb-4">
          <button type="button" onClick={exportCsv} className="btn-secondary">
            Export CSV
          </button>
        </div>
      )}

      {loading ? (
        <div className="card text-slate-400">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="card text-center text-slate-400">No translation history yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-800 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Original</th>
                <th className="px-4 py-3 font-medium">Translated</th>
                <th className="px-4 py-3 font-medium">Languages</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-t border-slate-700/60 hover:bg-surface-800/50">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-600/20 px-2 py-0.5 text-xs text-blue-300">
                      {item.mode}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-200">{item.original}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-blue-300">{item.translated}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {item.source_language} → {item.target_language}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
