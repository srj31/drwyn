import type { ReactNode } from 'react'
import type { SurfaceVisibility } from '@drwyn/react'

interface SurfaceShellProps {
  visibility: SurfaceVisibility
  full: ReactNode
  collapsed: ReactNode
}

/**
 * Renders one of three slots based on visibility.
 * 'hidden' renders null.
 * Used inside <Action>'s render-prop child to keep widgets declarative.
 */
export function SurfaceShell({ visibility, full, collapsed }: SurfaceShellProps) {
  if (visibility === 'hidden') return null
  if (visibility === 'collapsed') return <>{collapsed}</>
  return <>{full}</>
}
