const seen = new Set<string>()

export function devWarn(message: string): void {
  if (process.env.NODE_ENV === 'production') return
  if (seen.has(message)) return
  seen.add(message)
  console.warn(`[drwyn] ${message}`)
}

export function __resetDevWarnCacheForTests(): void {
  seen.clear()
}
