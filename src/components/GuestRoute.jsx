import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

// Opposite of ProtectedRoute: keeps signed-in users away from auth-only pages
// (login, register-company, forgot-password). Visiting /login while a session
// is active just bounces straight back to the dashboard.
export default function GuestRoute({ children }) {
  const { status } = useAuth()

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ink text-fog gap-2 select-none">
        <Loader2 size={22} className="animate-spin text-accent" />
        <p className="font-mono text-xs tracking-wide">verifying session…</p>
      </div>
    )
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  return children
}