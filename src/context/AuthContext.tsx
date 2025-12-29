import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { fetchCurrentUser } from '../services/users'
import type { User } from '../services/auth'

type AuthContextValue = {
  user: User | null
  loading: boolean
  error: string
  refreshUser: () => Promise<void>
  setSession: (session: { token: string; user?: User }) => void
  clearSession: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isRefreshing = useRef(false)

  const getStoredToken = () => localStorage.getItem('authToken') ?? ''

  const refreshUser = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    if (isRefreshing.current) return
    isRefreshing.current = true

    setLoading(true)
    setError('')

    try {
      const me = await fetchCurrentUser(token)
      setUser(me)
      localStorage.setItem('user', JSON.stringify(me))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível recuperar o usuário.'
      setError(message)
      setUser(null)
    } finally {
      setLoading(false)
      isRefreshing.current = false
    }
  }, [])

  const setSession = useCallback((session: { token: string; user?: User }) => {
    localStorage.setItem('authToken', session.token)
    if (session.user) {
      localStorage.setItem('user', JSON.stringify(session.user))
      setUser(session.user)
      setError('')
      setLoading(false)
    } else {
      void refreshUser()
    }
  }, [refreshUser])

  const clearSession = useCallback(() => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  useEffect(() => {
    const cachedUser = localStorage.getItem('user')
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser) as User)
      } catch {
        setUser(null)
      }
    }

    void refreshUser()
  }, [refreshUser])

  const value = useMemo(
    () => ({ user, loading, error, refreshUser, setSession, clearSession }),
    [user, loading, error, refreshUser, setSession, clearSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext deve ser usado dentro de AuthProvider')
  }
  return ctx
}
