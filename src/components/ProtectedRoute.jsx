import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children, requiredRole }) {
  const { status, hasRole } = useAuth()
  const location = useLocation()

  // 1. Session verification loading state
  if (status === 'checking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ink text-fog gap-2 select-none">
        <Loader2 size={22} className="animate-spin text-accent" />
        <p className="font-mono text-xs tracking-wide">verifying session…</p>
      </div>
    )
  }

  // 2. Unauthenticated state — redirect to login while saving intent URL
  if (status === 'anonymous') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. Optional RBAC authorization check
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />
  }

  return children
}