import { useEffect, useRef, useState } from 'react'
import { Paperclip, Upload, Trash2, Download, FileText, Loader2 } from 'lucide-react'
import { attachments as attachmentsApi, assetUrl } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const MAX_SIZE = 15 * 1024 * 1024 // 15MB — must match the backend

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(contentType) {
  return typeof contentType === 'string' && contentType.startsWith('image/')
}

export default function AttachmentSection({ taskId, task }) {
  const { user, hasRole } = useAuth()
  const { push } = useToast()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!taskId) return
    let cancelled = false
    setLoading(true)
    attachmentsApi
      .list(taskId)
      .then((data) => !cancelled && setList(Array.isArray(data) ? data : []))
      .catch((err) => !cancelled && push(err.message || 'Could not load attachments.', 'error'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [taskId, push])

  const canDelete = (att) =>
    att.uploadedBy?.id === user?.id || hasRole('ADMIN') || task?.reporter?.id === user?.id

  const handlePick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // allow re-picking the same file later

    if (file.size > MAX_SIZE) {
      push('File must be under 15MB.', 'error')
      return
    }

    setUploading(true)
    try {
      const created = await attachmentsApi.upload(taskId, file)
      setList((cur) => [created, ...cur])
      push('Attachment uploaded.', 'success')
    } catch (err) {
      push(err.message || 'Could not upload the file.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const remove = async (att) => {
    if (!window.confirm(`Remove "${att.originalName}"?`)) return
    const prev = list
    setList((cur) => cur.filter((a) => a.id !== att.id))
    try {
      await attachmentsApi.remove(taskId, att.id)
    } catch (err) {
      setList(prev)
      push(err.message || 'Could not remove the attachment.', 'error')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="label-eyebrow flex items-center gap-1.5 text-xs font-mono text-paper font-bold">
          <Paperclip size={13} className="text-accent" />
          <span>Attachments</span>
          {list.length > 0 && <span className="text-fog font-medium">({list.length})</span>}
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-mono font-semibold cursor-pointer disabled:opacity-50"
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          <span>{uploading ? 'uploading…' : 'add file'}</span>
        </button>
        <input ref={inputRef} type="file" className="hidden" onChange={handlePick} />
      </div>

      {loading ? (
        <p className="text-xs text-fog font-mono py-1">loading attachments…</p>
      ) : list.length === 0 ? (
        <p className="text-xs text-fog/80 font-mono py-1">No files attached yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {list.map((att) => {
            const href = assetUrl(att.url)
            return (
              <div
                key={att.id}
                className="group flex items-center gap-2.5 p-2 rounded-lg border border-panelBorder/70 bg-panelAlt/50 hover:border-accent/50 transition-colors"
              >
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 h-10 w-10 rounded-md overflow-hidden bg-panel/60 border border-panelBorder/60 flex items-center justify-center text-fog"
                  title={att.originalName}
                >
                  {isImage(att.contentType) ? (
                    <img src={href} alt={att.originalName} className="h-full w-full object-cover" />
                  ) : (
                    <FileText size={16} className="text-accent" />
                  )}
                </a>

                <div className="min-w-0 flex-1">
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-paper font-medium truncate block hover:text-accent transition-colors"
                    title={att.originalName}
                  >
                    {att.originalName}
                  </a>
                  <p className="text-[10px] text-fog font-mono truncate">
                    {formatBytes(att.size)}
                    {att.uploadedBy ? ` · ${att.uploadedBy.name || att.uploadedBy.username}` : ''}
                  </p>
                </div>

                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 p-1 text-fog hover:text-accent rounded-md transition-colors"
                  title="Open / download"
                >
                  <Download size={13} />
                </a>

                {canDelete(att) && (
                  <button
                    type="button"
                    onClick={() => remove(att)}
                    className="shrink-0 p-1 text-fog hover:text-overdue rounded-md transition-colors"
                    title="Remove attachment"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
