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

    let isMounted = true
    try {
      const me = await authApi.me()
      if (isMounted) {
        setUser(me)
        setStatus('authenticated')
      }
    } catch (err) {
      if (isMounted) {
        logout()
      }
    }

    return () => {
      isMounted = false
    }
  }, [logout])

  useEffect(() => {
    loadUser()
  }, [loadUser])

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