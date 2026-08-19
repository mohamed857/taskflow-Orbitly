import React, { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { ChatDockProvider } from './context/ChatDockContext.jsx'
import { RealtimeProvider } from './context/RealtimeContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import RequireRole from './components/RequireRole.jsx'
import Layout from './components/Layout.jsx'

// Route-level code-splitting: each page becomes its own chunk, loaded on demand.
const Login = lazy(() => import('./pages/Login.jsx'))
const RegisterCompany = lazy(() => import('./pages/RegisterCompany.jsx'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'))
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const KanbanBoard = lazy(() => import('./pages/KanbanBoard.jsx'))
const CalendarPage = lazy(() => import('./pages/CalendarPage.jsx'))
const MessagesPage = lazy(() => import('./pages/MessagesPage.jsx'))
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
              <Route path="/login" element={<Login />} />
              <Route path="/register-company" element={<RegisterCompany />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Authenticated Application Shell */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="board" element={<KanbanBoard />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="messages" element={<MessagesPage />} />
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