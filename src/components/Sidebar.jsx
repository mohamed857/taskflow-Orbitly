import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Kanban,
  CalendarDays,
  MessageCircle,
  ListChecks,
  UserCheck,
  ListTree,
  Users,
  Building2,
  Users2,
  UserCircle,
  X,
  Cpu
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from './Logo.jsx'

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/board', label: 'Board', icon: Kanban },
      { to: '/calendar', label: 'Calendar', icon: CalendarDays },
      { to: '/messages', label: 'Messages', icon: MessageCircle }
    ]
  },
  {
    title: 'Tasks',
    items: [
      { to: '/tasks/mine', label: 'My Tasks', icon: ListChecks },
      { to: '/tasks/assigned', label: 'Assigned to Me', icon: UserCheck },
      { to: '/tasks/team', label: 'Team Tasks', icon: ListTree, roles: ['TEAM_LEAD'] },
      { to: '/tasks/workspace', label: 'Workspace Tasks', icon: ListTree, roles: ['ADMIN', 'MANAGER'] }
    ]
  },
  {
    title: 'Workspace',
    items: [
      { to: '/users', label: 'Team', icon: Users },
      { to: '/teams', label: 'Teams', icon: Users2 },
      { to: '/workspaces', label: 'Workspace', icon: Building2 },
      { to: '/profile', label: 'Profile', icon: UserCircle }
    ]
  }
]

export default function Sidebar({ open, onClose }) {
  const { hasRole } = useAuth()

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-panel/80 dark:bg-panel/70 backdrop-blur-xl border-r border-panelBorder/70
          flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 shrink-0 select-none
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-panelBorder/40">
          <div className="flex items-center gap-2.5">
            <Logo size={24} className="text-accent shrink-0" />
            <span className="font-display font-bold text-xl tracking-tight text-gradient-animated">
              Orbitly
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-fog hover:text-paper hover:bg-panelAlt/60 transition-colors focus:outline-none focus:ring-1 focus:ring-accent/50"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.roles || hasRole(...item.roles)
            )

            if (visibleItems.length === 0) return null

            return (
              <div key={section.title} className="space-y-1">
                <p className="px-3 text-[10px] uppercase font-mono tracking-wider text-fog/60 font-semibold mb-2">
                  {section.title}
                </p>

                {visibleItems.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-accent/10 text-accent font-semibold border border-accent/20 shadow-sm'
                          : 'text-fog hover:text-paper hover:bg-panelAlt/60'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={16}
                          className={`shrink-0 transition-colors ${
                            isActive ? 'text-accent' : 'text-fog group-hover:text-paper'
                          }`}
                        />
                        <span className="truncate">{label}</span>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-accent rounded-r-full shadow-sm" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        {/* Console System Status Footer */}
        <div className="p-4 m-3 rounded-xl bg-panelAlt/40 border border-panelBorder/50 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <Cpu size={14} className="text-accent shrink-0" />
            <span className="label-eyebrow text-[10px]">system status</span>
          </div>
          <p className="text-[11px] text-fog font-mono">overdue sweep every ~24h</p>
        </div>
      </aside>
    </>
  )
}