/**
 * Reads the same anonymous user id that @drwyn/memory's createUserIdSource
 * persists to localStorage. Used by the analytics sink so events ship under
 * the same userId as memory writes.
 */
const ANON_ID_KEY = 'drwyn:anon-id'

export function getCurrentUserId(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(ANON_ID_KEY)
}
