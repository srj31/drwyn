/** Emit a dev-only `console.warn`, prefixed and no-op in production. */
export function devWarn(message: string): void {
  if (process.env.NODE_ENV === 'production') return
  if (typeof console === 'undefined') return
  console.warn(`[drwyn] ${message}`)
}
