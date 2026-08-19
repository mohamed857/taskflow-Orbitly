import { useMemo } from 'react'
import { useTheme } from '../context/ThemeContext.jsx'

// Mirrors the CSS variables in index.css. Recharts needs literal color
// strings (it can't consume Tailwind classes or CSS vars reliably for
// SVG props), so we keep a small JS copy of the two palettes here.
const PALETTES = {
  light: {
    panel: '#FFFFFF',
    panelAlt: '#F1F0EC',
    panelBorder: '#E7E5E0',
    fog: '#6B7280',
    paper: '#1A1D21',
    accent: '#0F9B8E',
    grid: '#E7E5E0',
    tooltipBg: '#FFFFFF'
  },
  dark: {
    panel: '#1A2029',
    panelAlt: '#20272F',
    panelBorder: '#262E3A',
    fog: '#8B94A3',
    paper: '#E8EAED',
    accent: '#4C7BF3',
    grid: '#262E3A',
    tooltipBg: '#1A2029'
  }
}

export function useChartColors() {
  const { theme } = useTheme()

  return useMemo(() => {
    return PALETTES[theme] ?? PALETTES.dark
  }, [theme])
}