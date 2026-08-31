import React from 'react'

// Detects the "stale chunk" failure that happens when a user has an old tab
// open and a new deploy has replaced the hashed lazy-loaded chunks.
function isChunkLoadError(error) {
  if (!error) return false
  const msg = String(error.message || error)
  return (
    error.name === 'ChunkLoadError' ||
    /Loading chunk [\w-]+ failed/i.test(msg) ||
    /dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  )
}

/**
 * App-level error boundary. Prevents a single render/lazy-load failure from
 * white-screening the whole SPA: it shows a recoverable fallback instead.
 * Class component because React error boundaries require lifecycle methods.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Surface for debugging; a real deployment can forward this to a logger.
    console.error('Unhandled UI error:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const isArabic =
      typeof document !== 'undefined' && document.documentElement.lang === 'ar'
    const chunk = isChunkLoadError(error)

    const title = chunk
      ? isArabic
        ? 'يتوفّر إصدار جديد'
        : 'A new version is available'
      : isArabic
        ? 'حدث خطأ غير متوقّع'
        : 'Something went wrong'

    const body = chunk
      ? isArabic
        ? 'تم تحديث التطبيق. أعِد التحميل لمتابعة العمل.'
        : 'The app was updated. Reload to continue.'
      : isArabic
        ? 'واجهنا مشكلة أثناء عرض هذه الصفحة.'
        : 'We hit a problem while rendering this page.'

    const reloadLabel = isArabic ? 'إعادة التحميل' : 'Reload'
    const retryLabel = isArabic ? 'حاول مرة أخرى' : 'Try again'

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-panel">
        <div className="console-panel max-w-md w-full p-8 text-center space-y-4 border border-panelBorder">
          <h1 className="font-display text-xl font-bold text-paper">{title}</h1>
          <p className="text-sm text-fog">{body}</p>

          {!chunk && error?.message && (
            <pre className="text-[11px] text-fog/70 font-mono bg-panelAlt/60 rounded-md p-3 overflow-x-auto text-left whitespace-pre-wrap">
              {String(error.message)}
            </pre>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {reloadLabel}
            </button>
            {!chunk && (
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 rounded-lg border border-panelBorder text-fog text-sm font-medium hover:text-paper hover:border-fog/60 transition-colors"
              >
                {retryLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
}
