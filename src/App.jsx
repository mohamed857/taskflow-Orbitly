import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ChatDockProvider } from './context/ChatDockContext.jsx'
import { RealtimeProvider } from './context/RealtimeContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import RequireRole from './components/RequireRole.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import RegisterCompany from './pages/RegisterCompany.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Dashboard from './pages/Dashboard.jsx'
import KanbanBoard from './pages/KanbanBoard.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import MessagesPage from './pages/MessagesPage.jsx'
import MyTasks from './pages/MyTasks.jsx'
import AssignedTasks from './pages/AssignedTasks.jsx'
import WorkspaceTasks from './pages/WorkspaceTasks.jsx'
import TeamTasks from './pages/TeamTasks.jsx'
import UsersPage from './pages/UsersPage.jsx'
import WorkspacesPage from './pages/WorkspacesPage.jsx'
import TeamsPage from './pages/TeamsPage.jsx'
import Profile from './pages/Profile.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <RealtimeProvider>
          <ChatDockProvider>
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
          </ChatDockProvider>
          </RealtimeProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}