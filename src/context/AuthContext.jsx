import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { auth as authApi, getToken, setToken } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('checking') // checking | authenticated | anonymous

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setStatus('anonymous')
  }, [])

  const loadUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setStatus('anonymous')
      return
    }

    try {
      const me = await authApi.me()
      setUser(me)
      setStatus('authenticated')
    } catch (err) {
      logout()
    }
  }, [logout])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // The API layer dispatches this event when any request comes back 401 and
  // clears the stored token. Without a listener the app kept its stale
  // "authenticated" state and never redirected to /login. Reacting here flips
  // the app to anonymous so ProtectedRoute sends the user to the login page.
  useEffect(() => {
    const handleUnauthorized = () => logout()
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [logout])

  const login = useCallback(
    async (credentials) => {
      const { token } = await authApi.login(credentials)
      setToken(token)
      await loadUser()
    },
    [loadUser]
  )

  const register = useCallback(async (payload) => {
    await authApi.register(payload)
  }, [])

  const registerCompany = useCallback(async (payload) => {
    await authApi.registerCompany(payload)
  }, [])

  const hasRole = useCallback(
    (...roles) => Boolean(user?.role) && roles.includes(user.role),
    [user?.role]
  )

  const value = useMemo(
    () => ({
      user,
      status,
      login,
      register,
      registerCompany,
      logout,
      hasRole,
      refresh: loadUser
    }),
    [user, status, login, register, registerCompany, logout, hasRole, loadUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}