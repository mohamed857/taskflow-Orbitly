import React, { Suspense, lazy } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { ChatDockProvider } from './context/ChatDockContext.jsx'
import { RealtimeProvider } from './context/RealtimeContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import RequireRole from './components/RequireRole.jsx'
import GuestRoute from './components/GuestRoute.jsx'
import Layout from './components/Layout.jsx'

// Route-level code-splitting: each page becomes its own chunk, loaded on demand.
const Landing = lazy(() => import('./pages/Landing.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const RegisterCompany = lazy(() => import('./pages/RegisterCompany.jsx'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'))
const FounderConsole = lazy(() => import('./pages/FounderConsole.jsx'))
const Pricing = lazy(() => import('./pages/Pricing.jsx'))
const Subscription = lazy(() => import('./pages/Subscription.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const KanbanBoard = lazy(() => import('./pages/KanbanBoard.jsx'))
const CalendarPage = lazy(() => import('./pages/CalendarPage.jsx'))
const MessagesPage = lazy(() => import('./pages/MessagesPage.jsx'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'))
const MyTasks = lazy(() => import('./pages/MyTasks.jsx'))
const AssignedTasks = lazy(() => import('./pages/AssignedTasks.jsx'))
const WorkspaceTasks = lazy(() => import('./pages/WorkspaceTasks.jsx'))
const TeamTasks = lazy(() => import('./pages/TeamTasks.jsx'))
const UsersPage = lazy(() => import('./pages/UsersPage.jsx'))
const WorkspacesPage = lazy(() => import('./pages/WorkspacesPage.jsx'))
const TeamsPage = lazy(() => import('./pages/TeamsPage.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))

function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <Loader2 size={26} className="animate-spin text-accent" />
      <p className="font-mono text-xs text-fog">Loading…</p>
    </div>
  )
}

// Root ("/") is dual-purpose: logged-out visitors get the public marketing
// landing (rendered full-screen, outside the app shell); logged-in users get
// the dashboard inside the normal Layout. Deeper paths (/board, /users, …)
// stay protected — an anonymous hit there falls through to the login redirect.
function RootGate() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'checking') return <RouteFallback />

  if (status !== 'authenticated' && location.pathname === '/') {
    return <Landing />
  }

  return (
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <LanguageProvider>
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <RealtimeProvider>
          <ChatDockProvider>
            <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
              <Route path="/register-company" element={<GuestRoute><RegisterCompany /></GuestRoute>} />
              <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
              <Route path="/pricing" element={<Pricing />} />

              {/* Root shell — public landing for guests, dashboard for members */}
              <Route path="/" element={<RootGate />}>
                <Route index element={<Dashboard />} />
                <Route path="board" element={<KanbanBoard />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="tasks/mine" element={<MyTasks />} />
                <Route path="tasks/assigned" element={<AssignedTasks />} />

                {/* Role-Scoped Task Views */}
                <Route
                  path="tasks/workspace"
                  element={
                    <RequireRole roles={['ADMIN', 'MANAGER']}>
                      <WorkspaceTasks />
                    </RequireRole>
                  }
                />
                <Route
                  path="tasks/team"
                  element={
                    <RequireRole roles={['TEAM_LEAD']}>
                      <TeamTasks />
                    </RequireRole>
                  }
                />

                {/* Workspace & Account Management */}
                <Route path="users" element={<UsersPage />} />
                <Route path="workspaces" element={<WorkspacesPage />} />
                <Route path="teams" element={<TeamsPage />} />
                <Route path="profile" element={<Profile />} />
                <Route path="subscription" element={<Subscription />} />

                {/* Founder console — platform owner only */}
                <Route
                  path="console"
                  element={
                    <RequireRole roles={['SUPER_ADMIN']}>
                      <FounderConsole />
                    </RequireRole>
                  }
                />
              </Route>

              {/* Wildcard Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </ChatDockProvider>
          </RealtimeProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
    </LanguageProvider>
  )
}