import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getMe, login as apiLogin, register as apiRegister } from '../api/client'

interface AuthContextValue {
  token: string | null
  username: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    getMe()
      .then((user) => setUsername(user.username))
      .catch(() => {
        localStorage.removeItem('token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = useCallback(async (user: string, password: string) => {
    const data = await apiLogin(user, password)
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    setUsername(data.username)
  }, [])

  const register = useCallback(async (user: string, email: string, password: string) => {
    await apiRegister(user, email, password)
    await login(user, password)
  }, [login])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUsername(null)
  }, [])

  const value = useMemo(
    () => ({
      token,
      username,
      isAuthenticated: !!token,
      loading,
      login,
      register,
      logout,
    }),
    [token, username, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
