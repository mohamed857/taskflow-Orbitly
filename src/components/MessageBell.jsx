import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Loader2, ArrowRight } from 'lucide-react'
import { messages as messagesApi, avatarSrc } from '../api/client.js'
import { useChatDock } from '../context/ChatDockContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Avatar from './Avatar.jsx'

function formatWhen(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000)
  if (diffMin < 1) return 'now'
  if (diffMin < 60) return `${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function MessageBell() {
  const navigate = useNavigate()
  const { push } = useToast()
  const { openChat } = useChatDock()
  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const dropdownRef = useRef(null)

  // Fetch unread count periodically
  useEffect(() => {
    let isMounted = true
    const refresh = () => {
      messagesApi
        .unreadCount()
        .then((res) => {
          if (isMounted) setUnread(res?.unread ?? 0)
        })
        .catch(() => {})
    }

    refresh()
    const interval = setInterval(refresh, 60000) // 1 minute interval for better accuracy
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Fetch conversations on popover open
  useEffect(() => {
    if (!open) return
    let isMounted = true
    setLoading(true)

    messagesApi
      .conversations()
      .then((data) => {
        if (isMounted) {
          const list = Array.isArray(data) ? data : []
          setConversations(list)
          // Dynamically compute unread count from returned conversations
          const totalUnread = list.reduce((acc, c) => acc + (c.unreadCount || 0), 0)
          setUnread(totalUnread)
        }
      })
      .catch((err) => {
        if (isMounted) push(err.message || 'Could not load conversations.', 'error')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [open, push])

  // Handle outside click & ESC key press
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const pick = (partner) => {
    setOpen(false)
    openChat(partner)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative text-fog hover:text-paper rounded-lg p-2 hover:bg-panelAlt/60 transition-colors focus:outline-none focus:ring-1 focus:ring-accent/50 cursor-pointer"
        aria-label="Messages"
        aria-expanded={open}
      >
        <MessageCircle size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-accent text-white text-[10px] font-mono font-medium flex items-center justify-center shadow-sm animate-in zoom-in-50">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Popover Menu */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-84 glass-panel rounded-xl border border-panelBorder/80 z-50 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-panel/60 border-b border-panelBorder/60">
            <span className="label-eyebrow font-display tracking-wider">Messages</span>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                navigate('/messages')
              }}
              className="inline-flex items-center gap-1 text-[11px] text-accent hover:text-accent/80 font-mono font-medium transition-colors cursor-pointer"
            >
              <span>See all</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Content Body */}
          <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-panelBorder/40 bg-panel/30">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-fog gap-1.5">
                <Loader2 size={18} className="animate-spin text-accent" />
                <span className="text-xs font-mono">Loading conversations…</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <p className="text-xs text-fog font-mono">No conversations yet.</p>
              </div>
            ) : (
              conversations.map((c) => {
                const partnerName = c.partner?.username || c.partner?.email || 'User'
                const hasUnread = c.unreadCount > 0

                return (
                  <button
                    key={c.partner?.id}
                    type="button"
                    onClick={() => pick(c.partner)}
                    className={`w-full flex items-center gap-3 text-left px-3.5 py-2.5 hover:bg-panelAlt/60 transition-colors cursor-pointer ${
                      hasUnread ? 'bg-accent/5' : ''
                    }`}
                  >
                    <Avatar
                      name={partnerName}
                      size={32}
                      src={avatarSrc(c.partner?.avatarUrl)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p
                          className={`text-xs truncate font-display ${
                            hasUnread ? 'font-semibold text-paper' : 'font-medium text-paper/90'
                          }`}
                        >
                          {partnerName}
                        </p>
                        <span className="text-[10px] text-fog font-mono shrink-0">
                          {formatWhen(c.lastMessageAt)}
                        </span>
                      </div>
                      <p
                        className={`text-xs truncate ${
                          hasUnread ? 'text-paper font-medium' : 'text-fog'
                        }`}
                      >
                        {c.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    {hasUnread && (
                      <span className="h-2 w-2 rounded-full bg-accent shrink-0 shadow-xs" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}