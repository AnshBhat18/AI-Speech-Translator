import { Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import DashboardPage from './pages/DashboardPage'
import TextTranslationPage from './pages/TextTranslationPage'
import SpeechTranslationPage from './pages/SpeechTranslationPage'
import FileTranslationPage from './pages/FileTranslationPage'
import OCRTranslationPage from './pages/OCRTranslationPage'
import HistoryPage from './pages/HistoryPage'
import FavoritesPage from './pages/FavoritesPage'
import AnalyticsPage from './pages/AnalyticsPage'
import LoginPage from './pages/LoginPage'
import { useAuth } from './context/AuthContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-900">
      <Sidebar />
      {children}
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <AppShell>
            <DashboardPage />
          </AppShell>
        }
      />
      <Route
        path="/text"
        element={
          <AppShell>
            <TextTranslationPage />
          </AppShell>
        }
      />
      <Route
        path="/speech"
        element={
          <AppShell>
            <SpeechTranslationPage />
          </AppShell>
        }
      />
      <Route
        path="/files"
        element={
          <AppShell>
            <FileTranslationPage />
          </AppShell>
        }
      />
      <Route
        path="/ocr"
        element={
          <AppShell>
            <OCRTranslationPage />
          </AppShell>
        }
      />
      <Route
        path="/history"
        element={
          <AppShell>
            <HistoryPage />
          </AppShell>
        }
      />
      <Route
        path="/favorites"
        element={
          <AppShell>
            <ProtectedRoute>
              <FavoritesPage />
            </ProtectedRoute>
          </AppShell>
        }
      />
      <Route
        path="/analytics"
        element={
          <AppShell>
            <AnalyticsPage />
          </AppShell>
        }
      />
    </Routes>
  )
}
