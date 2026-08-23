const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080'
const TOKEN_KEY = 'taskflow_token'
const REFRESH_KEY = 'taskflow_refresh_token'

// WebSocket (STOMP) endpoint derived from the API base: http->ws, https->wss.
export const WS_URL = `${API_BASE.replace(/^http/, 'ws')}/ws`

import { emitToast } from '../utils/toastBus.js'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function setRefreshToken(token) {
  if (token) localStorage.setItem(REFRESH_KEY, token)
  else localStorage.removeItem(REFRESH_KEY)
}

// Single-flight refresh: if several requests 401 at once, only one refresh call
// is made and the rest await its result.
let refreshInFlight = null
async function tryRefresh() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })
      .then(async (r) => {
        if (!r.ok) return false
        const d = await r.json().catch(() => null)
        if (d?.token) {
          setToken(d.token)
          if (d.refreshToken) setRefreshToken(d.refreshToken)
          return true
        }
        return false
      })
      .catch(() => false)
      .finally(() => {
        // Allow the next batch of 401s to trigger a new refresh.
        setTimeout(() => {
          refreshInFlight = null
        }, 0)
      })
  }
  return refreshInFlight
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

async function request(path, opts = {}) {
  const { method = 'GET', body, auth = true, silent = false, _retry = false } = opts
  const headers = {}

  if (body) {
    headers['Content-Type'] = 'application/json'
  }

  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })
  } catch {
    const message = 'Could not reach the server. Is the API running?'
    if (!silent) emitToast(message, 'error')
    throw new ApiError(message, 0, null)
  }

  // Handle 401 Unauthorized across all endpoints automatically. First try to
  // silently renew the access token with the refresh token and retry once;
  // only if that fails do we sign the user out.
  if (res.status === 401 && auth) {
    if (!_retry && path !== '/api/auth/refresh') {
      const refreshed = await tryRefresh()
      if (refreshed) {
        return request(path, { ...opts, _retry: true })
      }
    }
    setToken(null)
    setRefreshToken(null)
    const message = 'Session expired. Please log in again.'
    if (!silent) emitToast(message, 'error')
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    throw new ApiError(message, 401, null)
  }

  // Handle empty or non-JSON responses gracefully (e.g., 204 No Content on DELETE)
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json().catch(() => null) : null
  // Some backend errors (e.g. duplicate-record conflicts) reply with a plain
  // string body instead of JSON. Capture that text so the real reason survives.
  const textBody = !isJson && !res.ok ? await res.text().catch(() => null) : null

  // Plan/usage limit reached (402) -> let the app prompt an upgrade instead of
  // a plain error toast.
  if (res.status === 402 && data?.code === 'PLAN_LIMIT') {
    const message = data?.message || 'You have reached your plan limit.'
    window.dispatchEvent(new CustomEvent('plan:limit', { detail: message }))
    throw new ApiError(message, 402, data)
  }

  if (!res.ok) {
    // Surface the exact reason the server gave. The backend uses "message" for
    // some errors and "error" for others, and validation errors come back as a
    // { field: message } map — cover all three before a generic fallback.
    const fieldErrors =
      data && typeof data === 'object' && !data.message && !data.error
        ? Object.values(data).filter((v) => typeof v === 'string')
        : []
    const message =
      data?.message ||
      data?.error ||
      (fieldErrors.length ? fieldErrors.join(' · ') : null) ||
      (textBody && textBody.trim() && textBody.trim().length < 200 ? textBody.trim() : null) ||
      (res.status === 401
        ? 'Invalid email or password. Please check and try again.'
        : res.status === 403
        ? "You don't have permission to do that."
        : res.status === 404
        ? 'Requested resource was not found.'
        : `Request failed with status ${res.status}`)
    if (!silent) emitToast(message, 'error')
    throw new ApiError(message, res.status, data)
  }

  return data
}

export const auth = {
  registerCompany: (payload) => request('/api/auth/register-company', { method: 'POST', body: payload, auth: false }),
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload, auth: false }),
  refresh: (refreshToken) =>
    request('/api/auth/refresh', { method: 'POST', body: { refreshToken }, auth: false }),
  logout: (refreshToken) =>
    request('/api/auth/logout', { method: 'POST', body: { refreshToken }, auth: false, silent: true }),
  me: () => request('/api/users/me'),
  forgotPassword: (identifier) =>
    request('/api/auth/forgot-password', { method: 'POST', body: { identifier }, auth: false }),
  resetPassword: (token, newPassword) =>
    request('/api/auth/reset-password', { method: 'POST', body: { token, newPassword }, auth: false })
}

// Founder console (SUPER_ADMIN only): platform-wide user management.
export const admin = {
  users: (query = '') =>
    request(`/api/admin/users${query ? `?query=${encodeURIComponent(query)}` : ''}`),
  resetPassword: (id, newPassword) =>
    request(`/api/admin/users/${id}/reset-password`, { method: 'POST', body: { newPassword } })
}

export const users = {
  // تجلب المستخدمين المتاحين طبقاً لـ Role المستخدم الحالية تلقائياً من الباك إند
  listInWorkspace: () => request('/api/users/workspace'),
  // Full workspace directory — used for messaging so a DM can be started with
  // anyone (admins, managers, other teams), not just your own team roster.
  directory: () => request('/api/users/workspace/directory'),

  changeRole: (id, role) => request(`/api/users/${id}/role`, { method: 'PATCH', body: { role } }),
  changePassword: (currentPassword, newPassword) =>
    request('/api/users/me/password', { method: 'PATCH', body: { currentPassword, newPassword } }),
  create: (payload) => request('/api/users', { method: 'POST', body: payload }),
  uploadAvatar: async (file, { silent = false } = {}) => {
    const form = new FormData()
    form.append('file', file)
    
    let res
    try {
      res = await fetch(`${API_BASE}/api/users/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form
      })
    } catch {
      const message = 'Could not reach the server to upload avatar.'
      if (!silent) emitToast(message, 'error')
      throw new ApiError(message, 0, null)
    }

    const payload = await res.json().catch(() => ({}))

    if (!res.ok) {
      const message = payload.message || payload.error || 'Could not upload avatar.'
      if (!silent) emitToast(message, 'error')
      throw new ApiError(message, res.status, payload)
    }
    
    return payload
  }
}

export function avatarSrc(avatarUrl) {
  if (!avatarUrl) return null
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) return avatarUrl
  return `${API_BASE}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`
}

export const workspaces = {
  mine: () => request('/api/workspaces/me'),
  rename: (name) => request('/api/workspaces/me', { method: 'PUT', body: { name } }),
  deleteMine: () => request('/api/workspaces/me', { method: 'DELETE' })
}

export const teams = {
  list: () => request('/api/teams'),
  create: (name) => request('/api/teams', { method: 'POST', body: { name } }),
  assignMember: (teamId, userId) => request(`/api/teams/${teamId}/members/${userId}`, { method: 'PATCH' }),
  rename: (id, name) => request(`/api/teams/${id}`, { method: 'PUT', body: { name } }),
  remove: (id) => request(`/api/teams/${id}`, { method: 'DELETE' })
}

export const tasks = {
  mine: () => request('/api/tasks'),
  assigned: () => request('/api/tasks?assigned=true'),
  workspace: () => request('/api/tasks/workspace'),
  team: () => request('/api/tasks/team'),
  subtasks: (taskId) => request(`/api/tasks/${taskId}/subtasks`),
  get: (id) => request(`/api/tasks/${id}`),
  create: (payload) => request('/api/tasks', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/api/tasks/${id}`, { method: 'PUT', body: payload }),
  updateStatus: (id, status) => request(`/api/tasks/${id}/status`, { method: 'PATCH', body: { status } }),
  remove: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' })
}

export const activity = {
  list: (taskId) => request(`/api/tasks/${taskId}/activity`)
}

export const comments = {
  list: (taskId) => request(`/api/tasks/${taskId}/comments`),
  add: (taskId, content) => request(`/api/tasks/${taskId}/comments`, { method: 'POST', body: { content } }),
  remove: (taskId, commentId) => request(`/api/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' })
}

export const attachments = {
  list: (taskId) => request(`/api/tasks/${taskId}/attachments`),
  remove: (taskId, id) => request(`/api/tasks/${taskId}/attachments/${id}`, { method: 'DELETE' }),
  upload: async (taskId, file, { silent = false } = {}) => {
    const form = new FormData()
    form.append('file', file)

    let res
    try {
      res = await fetch(`${API_BASE}/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form
      })
    } catch {
      const message = 'Could not reach the server to upload the file.'
      if (!silent) emitToast(message, 'error')
      throw new ApiError(message, 0, null)
    }

    const payload = await res.json().catch(() => ({}))

    if (!res.ok) {
      const message = payload.message || payload.error || 'Could not upload the file.'
      if (!silent) emitToast(message, 'error')
      throw new ApiError(message, res.status, payload)
    }

    return payload
  }
}

// Builds an absolute URL for a server-stored asset path (avatars, attachments).
export const assetUrl = avatarSrc

export const labels = {
  list: () => request('/api/labels'),
  create: (name, color) => request('/api/labels', { method: 'POST', body: { name, color } }),
  remove: (id) => request(`/api/labels/${id}`, { method: 'DELETE' })
}

export const system = {
  nextSweep: () => request('/api/system/next-sweep')
}

export const notifications = {
  list: () => request('/api/notifications'),
  unreadCount: () => request('/api/notifications/unread-count'),
  markAsRead: (id) => request(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => request('/api/notifications/read-all', { method: 'PATCH' })
}

export const presence = {
  online: () => request('/api/presence')
}

export const plans = {
  list: () => request('/api/plans', { auth: false })
}

export const subscription = {
  get: () => request('/api/subscription'),
  change: (plan) => request('/api/subscription', { method: 'PUT', body: { plan } })
}

export const messages = {
  conversations: () => request('/api/messages/conversations'),
  thread: (userId) => request(`/api/messages/conversations/${userId}`),
  send: (userId, content) => request(`/api/messages/conversations/${userId}`, { method: 'POST', body: { content } }),
  unreadCount: () => request('/api/messages/unread-count')
}