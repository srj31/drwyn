import type { SurfaceConfig } from '@drwyn/memory'

export interface NavItem {
  slug: string
  label: string
  description: string
  emoji: string
  surface: SurfaceConfig
}

export const NAV_ITEMS: NavItem[] = [
  {
    slug: 'docs',
    label: 'Docs',
    description: 'Read the API reference.',
    emoji: '📘',
    surface: { defaultVisibility: 'full', collapseUntil: 0, promoteAfter: 1 },
  },
  {
    slug: 'pricing',
    label: 'Pricing',
    description: 'Compare plans.',
    emoji: '💸',
    surface: { defaultVisibility: 'collapsed', promoteAfter: 3, collapseUntil: 0 },
  },
  {
    slug: 'blog',
    label: 'Blog',
    description: 'Posts and changelog.',
    emoji: '✍️',
    surface: { defaultVisibility: 'collapsed', promoteAfter: 5, collapseUntil: 0 },
  },
  {
    slug: 'community',
    label: 'Community',
    description: 'Discord, GitHub, talks.',
    emoji: '💬',
    surface: { defaultVisibility: 'collapsed', promoteAfter: 4, collapseUntil: 0 },
  },
  {
    slug: 'careers',
    label: 'Careers',
    description: "We're not hiring (yet).",
    emoji: '🧪',
    surface: { defaultVisibility: 'full', hideAfter: 2, collapseUntil: 0, promoteAfter: 999 },
  },
]
