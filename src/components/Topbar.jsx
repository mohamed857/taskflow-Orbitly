import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, LogOut, ChevronDown, Sun, Moon, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import Avatar from './Avatar.jsx'
import { avatarSrc } from '../api/client.js'
import RoleBadge from './RoleBadge.jsx'
import SchedulerPulse from './SchedulerPulse.jsx'
import NotificationBell from './NotificationBell.jsx'
import MessageBell from './MessageBell.jsx'

export default function Topbar({ onMenuClick, onSweep, title }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-panelBorder/70 bg-panel/70 dark:bg-panel/60 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left Side: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden text-fog hover:text-paper p-1.5 rounded-lg hover:bg-panelAlt/60 transition-colors shrink-0"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-paper truncate">
            {title}
          </h1>

          {user?.workspaceName && (
            <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px] text-accent bg-accent/10 border border-accent/20 rounded-full px-3 py-0.5 font-medium shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="truncate max-w-[140px]">{user.workspaceName}</span>
            </span>
          )}
        </div>

        {/* Right Side: Quick Action Icons & Profile Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <SchedulerPulse onSweep={onSweep} />
          <NotificationBell />
          <MessageBell />

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="text-fog hover:text-paper rounded-lg p-2 hover:bg-panelAlt/60 border border-transparent hover:border-panelBorder/50 transition-all"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? (
              <Sun size={18} className="text-amber-400" />
            ) : (
              <Moon size={18} />
            )}
          </button>

          <div className="h-4 w-[1px] bg-panelBorder/60 mx-1 hidden sm:block" />

          {/* User Profile Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-panelAlt/60 border border-transparent hover:border-panelBorder/50 transition-all focus:outline-none cursor-pointer"
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              <Avatar
                name={user?.username || user?.email}
                size={30}
                src={avatarSrc(user?.avatarUrl)}
              />
              <span className="text-xs font-semibold text-paper hidden sm:inline max-w-[120px] truncate">
                {user?.username || user?.email}
              </span>
              <ChevronDown
                size={14}
                className={`text-fog transition-transform duration-200 ${
                  menuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {menuOpen && (
              <>
                {/* Overlay backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />

                <div className="absolute right-0 mt-2 w-56 bg-panel border border-panelBorder/80 shadow-2xl rounded-xl py-1.5 z-20 backdrop-blur-md animate-enter">
                  {/* User Information Summary */}
                  <div className="px-4 py-3 border-b border-panelBorder/60 bg-panelAlt/30">
                    <p className="text-xs font-semibold text-paper truncate">
                      {user?.username || 'User'}
                    </p>
                    <p className="text-[11px] text-fog font-mono truncate">
                      {user?.email}
                    </p>
                    {user?.role && (
                      <div className="mt-2">
                        <RoleBadge role={user.role} />
                      </div>
                    )}
                  </div>

                  {/* Navigation Actions */}
                  <div className="p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        navigate('/profile')
                      }}
                      className="w-full flex items-center gap-2 text-left px-3 py-2 text-xs font-medium text-fog hover:text-paper hover:bg-panelAlt/60 rounded-lg transition-colors cursor-pointer"
                    >
                      <User size={14} /> View profile
                    </button>

                    <button
                      type="button"
                      onClick={logout}
                      className="w-full flex items-center gap-2 text-left px-3 py-2 text-xs font-medium text-overdue hover:bg-overdue/10 rounded-lg transition-colors mt-1 cursor-pointer"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}