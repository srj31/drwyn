import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'drwyn example',
  description: 'Software that evolves for every user — adaptive UI demo for drwyn.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
