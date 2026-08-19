import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'taskflow_theme'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'dark'
}

function getResolvedTheme(themePreference) {
  if (themePreference === 'system') {
    if (typeof window === 'undefined') return 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return themePreference
}

export function ThemeProvider({ children }) {
  // Store user explicit choice: 'dark' | 'light' | 'system'
  const [themePreference, setThemePreference] = useState(getInitialTheme)
  const [activeTheme, setActiveTheme] = useState(() => getResolvedTheme(themePreference))

  // Update active theme whenever preference changes
  useEffect(() => {
    const resolved = getResolvedTheme(themePreference)
    setActiveTheme(resolved)

    const root = document.documentElement
    root.classList.toggle('dark', resolved === 'dark')
    root.setAttribute('data-theme', resolved)
    localStorage.setItem(STORAGE_KEY, themePreference)
  }, [themePreference])

  // Listen to system changes if preference is set to 'system'
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = (e) => {
      if (themePreference === 'system') {
        const resolved = e.matches ? 'dark' : 'light'
        setActiveTheme(resolved)
        const root = document.documentElement
        root.classList.toggle('dark', resolved === 'dark')
        root.setAttribute('data-theme', resolved)
      }
    }

    mediaQuery.addEventListener('change', handleSystemChange)
    return () => mediaQuery.removeEventListener('change', handleSystemChange)
  }, [themePreference])

  const toggleTheme = useCallback(() => {
    setThemePreference((prev) => {
      const currentResolved = getResolvedTheme(prev)
      return currentResolved === 'dark' ? 'light' : 'dark'
    })
  }, [])

  const value = useMemo(
    () => ({
      theme: activeTheme,
      themePreference,
      toggleTheme,
      setTheme: setThemePreference,
      isDark: activeTheme === 'dark'
    }),
    [activeTheme, themePreference, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}