import { useState, useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import ChatDock from './ChatDock.jsx'
import Logo from './Logo.jsx'

// Static route map for precise title lookups
const ROUTE_TITLES = {
  '/': 'Dashboard',
  '/board': 'Board',
  '/calendar': 'Calendar',
  '/messages': 'Messages',
  '/tasks/mine': 'My Tasks',
  '/tasks/assigned': 'Assigned to Me',
  '/tasks/team': 'Team Tasks',
  '/tasks/workspace': 'Workspace Tasks',
  '/users': 'Team',
  '/workspaces': 'Workspace',
  '/teams': 'Teams',
  '/profile': 'Profile'
}

/**
  Dynamic title resolver for exact paths and fallback sub-routes
 */
function resolvePageTitle(pathname) {
  if (ROUTE_TITLES[pathname]) {
    return ROUTE_TITLES[pathname]
  }

  // Handle dynamic sub-routes (e.g., /tasks/123 or /workspaces/settings)
  if (pathname.startsWith('/tasks/')) return 'Task Details'
  if (pathname.startsWith('/workspaces/')) return 'Workspace Settings'
  if (pathname.startsWith('/teams/')) return 'Team Details'
  if (pathname.startsWith('/users/')) return 'User Profile'

  return 'Orbitly'
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sweepSignal, setSweepSignal] = useState(0)
  const location = useLocation()

  // Compute title dynamically based on location
  const title = useMemo(
    () => resolvePageTitle(location.pathname),
    [location.pathname]
  )

  return (
    <div className="min-h-screen flex bg-ink text-paper selection:bg-accent/30 selection:text-paper relative overflow-x-hidden">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Navigation Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main App Container */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <Topbar
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
          onSweep={() => setSweepSignal((s) => s + 1)}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 px-4 sm:px-6 py-6 max-w-7xl w-full mx-auto">
          <div
            key={location.pathname}
            className="animate-enter transition-all duration-200"
          >
            <Outlet context={{ sweepSignal }} />
          </div>
        </main>

        {/* Copyright / brand footer */}
        <footer className="border-t border-panelBorder/40 px-4 sm:px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-fog">
            <Logo size={15} className="text-accent shrink-0" />
            <span className="text-[11px] font-mono">
              © {new Date().getFullYear()} Orbitly. All rights reserved.
            </span>
          </div>
        </footer>
      </div>

      {/* Global Floating Chat Dock */}
      <ChatDock />
    </div>
  )
}