import { type Plugin, definePlugin } from '@drwyn/react/plugin'
import type { MemoryStore, SurfaceConfig } from '../types'

const DEFAULT_PROMOTE_AFTER = 5
const DEFAULT_COLLAPSE_UNTIL = 3

interface SurfacePluginCtx {
  actionName?: string | undefined
  services: { memory?: MemoryStore | undefined }
}

/**
 * Render-phase visibility decider driven by the per-user use count.
 *
 * Heuristic (mount-snapshot, computed once per <Action> mount):
 *   if (!actionName || !memory || SSR) → defaultVisibility
 *   if (hideAfter set && uses >= hideAfter) → 'hidden'
 *   if (uses >= promoteAfter)               → 'full'
 *   if (uses >= collapseUntil)              → 'collapsed'
 *   else                                    → defaultVisibility
 *
 * Defaults: promoteAfter=5, collapseUntil=3. `hideAfter` is opt-in.
 */
export const surface: Plugin<SurfaceConfig, 'surface', 'surface'> = definePlugin({
  name: 'surface',
  propKey: 'surface',
  config: {} as SurfaceConfig,
  render: (cfg, ctx) => {
    const defaultVisibility = cfg.defaultVisibility

    // SSR safety: memory only meaningful on the client.
    if (typeof window === 'undefined') {
      return { visibility: defaultVisibility }
    }

    const sCtx = ctx as unknown as SurfacePluginCtx

    if (!sCtx.actionName) {
      return { visibility: defaultVisibility }
    }

    const memory = sCtx.services.memory
    if (!memory) {
      return { visibility: defaultVisibility }
    }

    const promoteAfter = cfg.promoteAfter ?? DEFAULT_PROMOTE_AFTER
    const collapseUntil = cfg.collapseUntil ?? DEFAULT_COLLAPSE_UNTIL

    const n = memory.uses(sCtx.actionName)

    if (cfg.hideAfter !== undefined && n >= cfg.hideAfter) {
      return { visibility: 'hidden' }
    }
    if (n >= promoteAfter) {
      return { visibility: 'full' }
    }
    if (n >= collapseUntil) {
      return { visibility: 'collapsed' }
    }
    return { visibility: defaultVisibility }
  },
})
