import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  FileText,
  Globe,
  History,
  Home,
  Image,
  LogOut,
  Mic,
  Star,
  Type,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/text', label: 'Text', icon: Type },
  { to: '/speech', label: 'Speech', icon: Mic },
  { to: '/files', label: 'Files', icon: FileText },
  { to: '/ocr', label: 'OCR', icon: Image },
  { to: '/history', label: 'History', icon: History },
  { to: '/favorites', label: 'Favorites', icon: Star, auth: true },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Sidebar() {
  const { isAuthenticated, username, logout } = useAuth()

  return (
    <aside
      className="flex h-screen w-64 flex-col border-r border-slate-700/60 bg-gradient-to-b from-slate-900 to-surface-900"
      aria-label="Main navigation"
    >
      <div className="flex items-center gap-3 border-b border-slate-700/60 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600">
          <Globe className="h-5 w-5 text-white" aria-hidden />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white">Speech Translator</h1>
          <p className="text-xs text-slate-400">Pro v2.0</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems
          .filter((item) => !item.auth || isAuthenticated)
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </NavLink>
          ))}
      </nav>

      <div className="border-t border-slate-700/60 p-4">
        {isAuthenticated ? (
          <div className="space-y-3">
            <p className="truncate px-2 text-xs text-slate-400">
              Signed in as <span className="font-medium text-slate-200">{username}</span>
            </p>
            <button
              type="button"
              onClick={logout}
              className="btn-secondary w-full"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </button>
          </div>
        ) : (
          <NavLink to="/login" className="btn-primary w-full text-center">
            Sign in
          </NavLink>
        )}
      </div>
    </aside>
  )
}
