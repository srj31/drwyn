import { getDrwynClient } from './drwyn'
import { getCurrentUserId } from './user-id'

interface SinkPayload {
  name: string
  props?: Record<string, unknown> | undefined
}

/**
 * Matches the ActionServicesRegistry.sink signature from @drwyn/react:
 *   (event: { name: string; props?: Record<string, unknown> | undefined }) => void
 *
 * Fire-and-forget. Failures are dev-warned but never break the UI. If the anon
 * user id hasn't been seeded yet (likely SSR or pre-mount), the event is
 * dropped — the next interaction will fire after MemoryStore has written the
 * anon id to localStorage.
 */
export function analyticsSink(event: SinkPayload): void {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console -- intentional dev visibility
    console.debug('[drwyn:analytics]', event.name, event.props ?? {})
  }
  const userId = getCurrentUserId()
  if (!userId) return
  void getDrwynClient()
    .sendEvent({ userId, name: event.name, props: event.props })
    .catch((err) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[drwyn:analytics] sendEvent failed', err)
      }
    })
}
