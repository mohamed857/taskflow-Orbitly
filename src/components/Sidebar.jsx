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
  Network,
  UserCircle,
  CreditCard,
  ShieldAlert,
  X,
  Cpu
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useI18n } from '../context/LanguageContext.jsx'
import Logo from './Logo.jsx'

const NAV_SECTIONS = [
  {
    tkey: 'section.overview',
    items: [
      { to: '/', tkey: 'nav.dashboard', icon: LayoutDashboard, end: true },
      { to: '/board', tkey: 'nav.board', icon: Kanban },
      { to: '/calendar', tkey: 'nav.calendar', icon: CalendarDays },
      { to: '/messages', tkey: 'nav.messages', icon: MessageCircle }
    ]
  },
  {
    tkey: 'section.tasks',
    items: [
      { to: '/tasks/mine', tkey: 'nav.myTasks', icon: ListChecks },
      { to: '/tasks/assigned', tkey: 'nav.assigned', icon: UserCheck },
      { to: '/tasks/team', tkey: 'nav.teamTasks', icon: ListTree, roles: ['TEAM_LEAD'] },
      { to: '/tasks/workspace', tkey: 'nav.workspaceTasks', icon: ListTree, roles: ['ADMIN', 'MANAGER'] }
    ]
  },
  {
    tkey: 'section.workspace',
    items: [
      { to: '/users', tkey: 'nav.team', icon: Users },
      { to: '/teams', tkey: 'nav.teams', icon: Network },
      { to: '/workspaces', tkey: 'nav.workspace', icon: Building2 },
      { to: '/subscription', tkey: 'nav.subscription', icon: CreditCard, roles: ['ADMIN', 'MANAGER'] },
      { to: '/profile', tkey: 'nav.profile', icon: UserCircle }
    ]
  }
]

// The founder (SUPER_ADMIN) doesn't run day-to-day task work, so their sidebar
// is trimmed to the platform console plus their own profile.
const FOUNDER_SECTIONS = [
  {
    label: 'Platform',
    items: [
      { to: '/console', label: 'Founder Console', icon: ShieldAlert, end: true },
      { to: '/profile', label: 'Profile', icon: UserCircle }
    ]
  }
]

export default function Sidebar({ open, onClose }) {
  const { hasRole } = useAuth()
  const { t } = useI18n()

  const isFounder = hasRole('SUPER_ADMIN')
  const sections = isFounder ? FOUNDER_SECTIONS : NAV_SECTIONS

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
            <Logo size={24} className="text-accent shrink-0" animated />
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
          {sections.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.roles || hasRole(...item.roles)
            )

            if (visibleItems.length === 0) return null

            const heading = section.label ?? t(section.tkey)

            return (
              <div key={section.tkey ?? section.label} className="space-y-1">
                <p className="px-3 text-[10px] uppercase font-mono tracking-wider text-fog/60 font-semibold mb-2">
                  {heading}
                </p>

                {visibleItems.map(({ to, tkey, label, icon: Icon, end }) => (
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
                        <span className="truncate">{label ?? t(tkey)}</span>
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
