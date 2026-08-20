import { useEffect, useState } from 'react'
import { History, Plus, RefreshCw, UserCheck, Flag, Pencil, Loader2 } from 'lucide-react'
import { activity as activityApi } from '../api/client.js'
import { parseServerDate } from '../utils/serverTime.js'
import { displayName } from '../utils/userDisplay.js'

const ICONS = {
  CREATED: Plus,
  STATUS_CHANGED: RefreshCw,
  ASSIGNEE_CHANGED: UserCheck,
  PRIORITY_CHANGED: Flag,
  UPDATED: Pencil
}

function formatWhen(dateStr) {
  const d = parseServerDate(dateStr)
  if (!d) return ''
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ActivityTimeline({ taskId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!taskId) return
    let cancelled = false
    setLoading(true)
    activityApi
      .list(taskId)
      .then((data) => !cancelled && setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [taskId])

  return (
    <div className="space-y-3">
      <p className="label-eyebrow flex items-center gap-1.5 text-xs font-mono text-paper font-bold">
        <History size={13} className="text-accent" />
        <span>Activity</span>
        {items.length > 0 && <span className="text-fog font-medium">({items.length})</span>}
      </p>

      {loading ? (
        <p className="text-xs text-fog font-mono py-1">loading activity…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-fog/80 font-mono py-1">No activity recorded yet.</p>
      ) : (
        <ol className="space-y-2.5">
          {items.map((a) => {
            const Icon = ICONS[a.type] ?? History
            const who = a.actor ? displayName(a.actor) : 'Someone'
            return (
              <li key={a.id} className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-accent/10 text-accent">
                  <Icon size={12} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-paper leading-snug">
                    <span className="font-semibold">{who}</span>{' '}
                    <span className="text-fog">{a.detail || a.type}</span>
                  </p>
                  <p className="text-[10px] text-fog/70 font-mono">{formatWhen(a.createdAt)}</p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
