import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function RequireRole({ roles, children }) {
  const { hasRole } = useAuth()

  if (!hasRole(...roles)) {
    return <Navigate to="/" replace />
  }

  return children
}
