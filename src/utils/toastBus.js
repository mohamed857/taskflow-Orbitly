let listeners = []

/**
 * Subscribes a callback listener to global toast bus events.
 * Returns an unsubscribe function to clean up listeners.
 */
export function subscribeToastBus(fn) {
  if (typeof fn !== 'function') return () => {}

  listeners.push(fn)

  return () => {
    listeners = listeners.filter((l) => l !== fn)
  }
}

/**
 * Emits a toast event to all active subscribers.
 */
export function emitToast(message, variant = 'error') {
  if (!message) return

  // Iterate over a snapshot array to safely prevent mutation errors during dispatch
  const snapshot = [...listeners]
  snapshot.forEach((fn) => {
    try {
      fn(message, variant)
    } catch (err) {
      console.error('[ToastBus] Error in subscriber callback:', err)
    }
  })
}

/**
 * Clears all active subscribers (useful for unit testing or teardown).
 */
export function clearToastBus() {
  listeners = []
}