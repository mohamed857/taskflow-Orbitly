import { useEffect, useRef, useState } from 'react'
import { Send, Search, X, MessageSquarePlus, Loader2, ArrowLeft } from 'lucide-react'
import { messages as messagesApi, users as usersApi, avatarSrc } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useRealtime } from '../context/RealtimeContext.jsx'
import Avatar from '../components/Avatar.jsx'
import { displayName } from '../utils/userDisplay.js'
import Portal from '../components/Portal.jsx'

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

function NewConversationPicker({ currentUserId, onPick, onClose }) {
  const [team, setTeam] = useState([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    usersApi.listInWorkspace().then(setTeam).catch(() => {})
  }, [])

  const filtered = team
    .filter((u) => u.id !== currentUserId)
    .filter((u) => {
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    })

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-ink/75 backdrop-blur-sm" onClick={onClose} />
        <div className="relative glass-panel w-full max-w-sm max-h-[70vh] overflow-hidden flex flex-col p-4 shadow-2xl border border-panelBorder/80 animate-enter">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-panelBorder/40">
            <p className="font-display font-semibold text-paper text-sm">New Direct Message</p>
            <button
              onClick={onClose}
              className="text-fog hover:text-paper p-1 rounded-md hover:bg-panelAlt/50 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fog" />
            <input
              autoFocus
              className="input-field pl-8 w-full text-xs"
              placeholder="Search teammates…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-fog font-mono text-center py-8">no matches found</p>
            ) : (
              filtered.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onPick(u)}
                  className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-panelAlt/60 transition-all text-left group"
                >
                  <Avatar name={displayName(u)} size={32} src={avatarSrc(u.avatarUrl)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-paper truncate group-hover:text-accent transition-colors">
                      {displayName(u)}
                    </p>
                    <p className="text-[11px] text-fog truncate">{u.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
}

export default function MessagesPage() {
  const { user } = useAuth()
  const { push } = useToast()
  const { subscribeMessages, subscribeReads, subscribeTyping, sendTyping, isOnline } = useRealtime()
  const [partnerTyping, setPartnerTyping] = useState(false)
  const typingSentAtRef = useRef(0)
  const typingStopTimerRef = useRef(null)
  const typingClearRef = useRef(null)
  const [conversations, setConversations] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [activePartner, setActivePartner] = useState(null)
  const [thread, setThread] = useState([])
  const [loadingThread, setLoadingThread] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const bottomRef = useRef(null)

  // Keep the active partner reachable from the (stable) realtime callbacks.
  const activePartnerRef = useRef(activePartner)
  useEffect(() => {
    activePartnerRef.current = activePartner
  }, [activePartner])

  // Live incoming messages pushed over WebSocket.
  useEffect(() => {
    return subscribeMessages((msg) => {
      const partnerId = msg.sender?.id === user?.id ? msg.recipient?.id : msg.sender?.id
      const viewing = activePartnerRef.current?.id === partnerId
      if (viewing) {
        setThread((cur) => (cur.some((m) => m.id === msg.id) ? cur : [...cur, msg]))
      }
      setConversations((cur) => {
        const exists = cur.some((c) => c.partner.id === partnerId)
        const updated = exists
          ? cur.map((c) =>
              c.partner.id === partnerId
                ? {
                    ...c,
                    lastMessage: msg.content,
                    lastMessageAt: msg.createdAt,
                    unreadCount: viewing ? 0 : (c.unreadCount || 0) + 1
                  }
                : c
            )
          : [
              {
                partner: msg.sender,
                lastMessage: msg.content,
                lastMessageAt: msg.createdAt,
                unreadCount: viewing ? 0 : 1
              },
              ...cur
            ]
        return [...updated].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      })
    })
  }, [subscribeMessages, user?.id])

  // Live read receipts: the partner opened our conversation -> mark my messages seen.
  useEffect(() => {
    return subscribeReads((receipt) => {
      if (activePartnerRef.current?.id === receipt.readerId) {
        setThread((cur) => cur.map((m) => (m.sender?.id === user?.id ? { ...m, read: true } : m)))
      }
    })
  }, [subscribeReads, user?.id])

  // Live typing indicator from the active partner.
  useEffect(() => {
    return subscribeTyping((evt) => {
      if (activePartnerRef.current?.id !== evt.fromUserId) return
      setPartnerTyping(evt.typing)
      if (evt.typing) {
        clearTimeout(typingClearRef.current)
        typingClearRef.current = setTimeout(() => setPartnerTyping(false), 4000)
      }
    })
  }, [subscribeTyping])

  // Tell the partner we're typing (throttled), and that we stopped after a pause.
  const notifyTyping = () => {
    if (!activePartner) return
    const now = Date.now()
    if (now - typingSentAtRef.current > 2000) {
      sendTyping(activePartner.id, true)
      typingSentAtRef.current = now
    }
    clearTimeout(typingStopTimerRef.current)
    typingStopTimerRef.current = setTimeout(() => {
      sendTyping(activePartner.id, false)
      typingSentAtRef.current = 0
    }, 2500)
  }

  const loadConversations = () => {
    setLoadingList(true)
    messagesApi
      .conversations()
      .then((data) => setConversations(Array.isArray(data) ? data : []))
      .catch((err) => push(err.message || 'Could not load conversations.', 'error'))
      .finally(() => setLoadingList(false))
  }

  useEffect(() => {
    loadConversations()
  }, [])

  const openThread = (partner) => {
    setActivePartner(partner)
    setThread([])
    setPartnerTyping(false)
    setLoadingThread(true)

    messagesApi
      .thread(partner.id)
      .then((data) => {
        setThread(Array.isArray(data) ? data : [])
        setConversations((cur) =>
          cur.map((c) => (c.partner.id === partner.id ? { ...c, unreadCount: 0 } : c))
        )
      })
      .catch((err) => push(err.message || 'Could not load conversation.', 'error'))
      .finally(() => setLoadingThread(false))
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  const send = async (e) => {
    e.preventDefault()
    const content = draft.trim()
    if (!content || !activePartner) return
    setSending(true)
    try {
      const sent = await messagesApi.send(activePartner.id, content)
      setThread((cur) => [...cur, sent])
      setDraft('')
      sendTyping(activePartner.id, false)
      clearTimeout(typingStopTimerRef.current)
      setConversations((cur) => {
        const exists = cur.some((c) => c.partner.id === activePartner.id)
        const updated = exists
          ? cur.map((c) =>
              c.partner.id === activePartner.id
                ? { ...c, lastMessage: content, lastMessageAt: sent.createdAt }
                : c
            )
          : [{ partner: activePartner, lastMessage: content, lastMessageAt: sent.createdAt, unreadCount: 0 }, ...cur]
        return updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      })
    } catch (err) {
      push(err.message || 'Could not send message.', 'error')
    } finally {
      setSending(false)
    }
  }

  const startNewConversation = (partnerUser) => {
    setPickerOpen(false)
    const summary = { id: partnerUser.id, username: partnerUser.username, email: partnerUser.email, avatarUrl: partnerUser.avatarUrl }
    openThread(summary)
  }

  return (
    <div className="glass-panel h-[calc(100vh-140px)] min-h-[460px] flex overflow-hidden border border-panelBorder/80 animate-enter">
      {/* Conversation Sidebar */}
      <div
        className={`w-full sm:w-80 border-r border-panelBorder/50 flex flex-col bg-panel/30 ${
          activePartner ? 'hidden sm:flex' : 'flex'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-panelBorder/50 bg-panelAlt/30">
          <span className="label-eyebrow text-xs">Direct Messages</span>
          <button
            onClick={() => setPickerOpen(true)}
            title="Start new conversation"
            className="text-fog hover:text-accent p-1 rounded-md hover:bg-panelAlt/50 transition-colors"
          >
            <MessageSquarePlus size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-panelBorder/30">
          {loadingList ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin text-accent" />
              <p className="font-mono text-xs text-fog">Loading chats…</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <p className="text-xs text-fog">No conversations started.</p>
              <button
                onClick={() => setPickerOpen(true)}
                className="text-xs text-accent hover:underline font-mono"
              >
                + New message
              </button>
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = activePartner?.id === c.partner.id
              return (
                <button
                  key={c.partner.id}
                  onClick={() => openThread(c.partner)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                    isActive
                      ? 'bg-accent/15 border-l-2 border-accent'
                      : 'hover:bg-panelAlt/40 border-l-2 border-transparent'
                  }`}
                >
                  <Avatar
                    name={c.partner.username || c.partner.email}
                    size={36}
                    src={avatarSrc(c.partner.avatarUrl)}
                    status={isOnline(c.partner.id) ? 'online' : undefined}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-xs font-semibold text-paper truncate">{displayName(c.partner)}</p>
                      <span className="text-[10px] text-fog font-mono shrink-0">
                        {formatWhen(c.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-fog truncate">{c.lastMessage}</p>
                      {c.unreadCount > 0 && (
                        <span className="h-4 min-w-[16px] px-1 rounded-full bg-accent text-slate-950 text-[10px] font-bold font-mono flex items-center justify-center shrink-0">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Active Conversation Thread */}
      <div className={`flex-1 flex flex-col bg-panel/10 ${activePartner ? 'flex' : 'hidden sm:flex'}`}>
        {!activePartner ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="h-12 w-12 rounded-2xl bg-panelAlt/50 border border-panelBorder/60 flex items-center justify-center mb-3 text-fog">
              <MessageSquarePlus size={22} />
            </div>
            <p className="text-xs text-fog font-mono">Select a teammate to start chatting</p>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-panelBorder/50 bg-panelAlt/20">
              <button
                onClick={() => setActivePartner(null)}
                className="sm:hidden text-fog hover:text-paper p-1 rounded-md hover:bg-panelAlt/50 transition-colors"
                aria-label="Back to messages list"
              >
                <ArrowLeft size={18} />
              </button>
              <Avatar
                name={activePartner.username || activePartner.email}
                size={32}
                src={avatarSrc(activePartner.avatarUrl)}
                status={isOnline(activePartner.id) ? 'online' : 'offline'}
              />
              <div>
                <p className="text-xs font-bold text-paper">{displayName(activePartner)}</p>
                <p className="text-[10px] font-mono">
                  {partnerTyping ? (
                    <span className="text-accent">typing…</span>
                  ) : isOnline(activePartner.id) ? (
                    <span className="text-completed">● online</span>
                  ) : (
                    <span className="text-fog">offline</span>
                  )}
                </p>
              </div>
            </div>

            {/* Chat Bubble Stream */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loadingThread ? (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin text-accent" />
                  <p className="font-mono text-xs text-fog">Fetching message history…</p>
                </div>
              ) : thread.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-xs text-fog font-mono">
                    Say hi to {activePartner.username?.split(' ')[0] || 'them'} 👋
                  </p>
                </div>
              ) : (
                thread.map((m) => {
                  const mine = m.sender?.id === user?.id
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-xl px-3.5 py-2 text-xs shadow-sm ${
                          mine
                            ? 'bg-accent text-slate-950 font-medium rounded-br-xs'
                            : 'bg-panelAlt/80 text-paper border border-panelBorder/60 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                        <p
                          className={`text-[9px] font-mono mt-1 text-right ${
                            mine ? 'text-slate-950/70' : 'text-fog'
                          }`}
                        >
                          {formatWhen(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              {(() => {
                let lastMine = null
                for (let i = thread.length - 1; i >= 0; i--) {
                  if (thread[i].sender?.id === user?.id) { lastMine = thread[i]; break }
                }
                return lastMine?.read ? (
                  <p className="text-[10px] text-fog font-mono text-right pr-1">Seen</p>
                ) : null
              })()}
              <div ref={bottomRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={send} className="p-3 border-t border-panelBorder/50 bg-panelAlt/20 flex items-center gap-2">
              <input
                className="input-field flex-1 text-xs py-2.5"
                placeholder="Write a message…"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value)
                  notifyTyping()
                }}
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="btn-primary px-3.5 py-2.5 shrink-0 flex items-center justify-center"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
          </>
        )}
      </div>

      {pickerOpen && (
        <NewConversationPicker
          currentUserId={user?.id}
          onPick={startNewConversation}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}