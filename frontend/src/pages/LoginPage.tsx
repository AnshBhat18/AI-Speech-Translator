import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import Alert from '../components/Alert'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(username, password)
      } else {
        await register(username, email, password)
      }
      window.location.href = '/'
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-900 p-6">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-white">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {mode === 'login'
            ? 'Sign in to save favorites and sync history'
            : 'Register to unlock personalized features'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="username" className="label">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              required
              autoComplete="username"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
                autoComplete="email"
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <Alert type="error" message={error} />}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {mode === 'login' ? (
            <>
              No account?{' '}
              <button type="button" onClick={() => setMode('register')} className="text-blue-400 hover:underline">
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('login')} className="text-blue-400 hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>

        <p className="mt-4 text-center">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-300">
            Continue without signing in
          </Link>
        </p>
      </div>
    </div>
  )
}
