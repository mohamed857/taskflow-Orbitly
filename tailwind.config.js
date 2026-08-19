/** @type {import('tailwindcss').Config} */
function withVar(name) {
  return `rgb(var(${name}) / <alpha-value>)`
}

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme-aware structural CSS variables
        ink: withVar('--color-ink'),
        panel: withVar('--color-panel'),
        panelAlt: withVar('--color-panelAlt'),
        panelBorder: withVar('--color-panelBorder'),
        fog: withVar('--color-fog'),
        paper: withVar('--color-paper'),
        accent: withVar('--color-accent'),

        // Fixed semantic task status colors
        pending: '#F59E0B',
        inprogress: '#38BDF8',
        completed: '#10B981',
        overdue: withVar('--color-overdue'),

        // Workspace role badges
        roleAdmin: '#C084FC',
        roleManager: '#38BDF8',
        roleTeamLead: '#34D399',
        roleUser: '#94A3B8'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Inter"', '"IBM Plex Sans"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.7)', opacity: '0.7' },
          '100%': { transform: 'scale(2.2)', opacity: '0' }
        },
        slideIn: {
          '0%': { transform: 'translateX(12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        shimmerText: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        }
      },
      animation: {
        pulseRing: 'pulseRing 2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite',
        slideIn: 'slideIn 0.25s ease-out',
        enter: 'fadeInUp 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)',
        shimmer: 'shimmerText 5s ease-in-out infinite'
      }
    }
  },
  plugins: []
}