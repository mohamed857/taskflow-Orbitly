import { useEffect, useRef, useState } from 'react'
import { Send, Trash2, MessageSquare, Loader2 } from 'lucide-react'
import { comments as commentsApi, avatarSrc } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Avatar from './Avatar.jsx'
import { parseServerDate } from '../utils/serverTime.js'

function formatWhen(dateStr) {
  const d = parseServerDate(dateStr)
  if (!d) return dateStr || ''
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function CommentThread({ taskId }) {
  const { user, hasRole } = useAuth()
  const { push } = useToast()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const listContainerRef = useRef(null)

  const scrollToBottom = () => {
    if (listContainerRef.current) {
      listContainerRef.current.scrollTo({
        top: listContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    commentsApi
      .list(taskId)
      .then((data) => {
        if (!cancelled) {
          setList(Array.isArray(data) ? data : [])
        }
      })
      .catch((err) => !cancelled && push(err.message || 'Could not load comments.', 'error'))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [taskId, push])

  const submit = async (e) => {
    if (e) e.preventDefault()
    const content = draft.trim()
    if (!content || submitting) return

    const tempId = `temp-${Date.now()}`
    const tempComment = {
      id: tempId,
      content,
      author: user,
      createdAt: new Date().toISOString(),
      isPending: true
    }

    // Optimistic Update
    setList((cur) => [...cur, tempComment])
    setDraft('')
    setSubmitting(true)
    setTimeout(scrollToBottom, 50)

    try {
      const created = await commentsApi.add(taskId, content)
      setList((cur) => cur.map((c) => (c.id === tempId ? created : c)))
    } catch (err) {
      setList((cur) => cur.filter((c) => c.id !== tempId))
      setDraft(content) // Restore input on failure
      push(err.message || 'Could not post comment.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (commentId) => {
    const prev = list
    setList((cur) => cur.filter((c) => c.id !== commentId))
    try {
      await commentsApi.remove(taskId, commentId)
    } catch (err) {
      setList(prev)
      push(err.message || 'Could not delete comment.', 'error')
    }
  }

  return (
    <div className="space-y-3">
      {/* Thread Header */}
      <div className="flex items-center gap-2">
        <MessageSquare size={14} className="text-accent shrink-0" />
        <span className="label-eyebrow">
          Comments {list.length > 0 && `(${list.length})`}
        </span>
      </div>

      {/* Scrollable Comments List */}
      <div 
        ref={listContainerRef}
        className="space-y-3 max-h-72 overflow-y-auto pr-1.5 custom-scrollbar"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 text-fog gap-1.5">
            <Loader2 size={18} className="animate-spin text-accent" />
            <span className="text-xs font-mono">Loading thread…</span>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-panelBorder/60 rounded-xl bg-panel/30">
            <p className="text-xs text-fog font-mono">
              No comments yet — be the first to say something 👋
            </p>
          </div>
        ) : (
          list.map((c) => {
            const canDelete = !c.isPending && (c.author?.id === user?.id || hasRole('ADMIN'))
            const authorName = c.author?.name || c.author?.username || c.author?.email || 'User'

            return (
              <div 
                key={c.id} 
                className={`flex gap-2.5 p-2.5 rounded-xl bg-panelAlt/40 border border-panelBorder/40 transition-all hover:bg-panelAlt/60 ${
                  c.isPending ? 'opacity-60' : 'opacity-100'
                }`}
              >
                <Avatar 
                  name={authorName} 
                  size={28} 
                  src={avatarSrc(c.author?.avatarUrl)} 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="text-paper text-xs font-semibold font-display truncate">
                        {authorName}
                      </span>
                      <span className="text-fog text-[10px] font-mono shrink-0">
                        {c.isPending ? 'posting…' : formatWhen(c.createdAt)}
                      </span>
                    </div>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => remove(c.id)}
                        title="Delete comment"
                        className="p-1 text-fog hover:text-overdue hover:bg-overdue/10 rounded-md transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-paper/90 leading-relaxed whitespace-pre-wrap break-words">
                    {c.content}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={submit} className="flex items-start gap-2 pt-2 border-t border-panelBorder/60">
        <textarea
          className="input-field flex-1 text-xs py-2 px-3 resize-none rounded-xl bg-panelAlt/40 focus:bg-panelAlt border border-panelBorder/60"
          rows={2}
          placeholder="Write a comment… (Press Enter to send)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={submitting}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit(e)
            }
          }}
        />
        <button
          type="submit"
          disabled={submitting || !draft.trim()}
          className="btn-primary h-10 w-10 p-0 flex items-center justify-center shrink-0 rounded-xl disabled:opacity-40 cursor-pointer"
          aria-label="Post comment"
        >
          {submitting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
        </button>
      </form>
    </div>
  )
}