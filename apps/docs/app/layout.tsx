import type { Metadata } from 'next'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata: Metadata = {
  title: {
    default: 'drwyn',
    template: '%s — drwyn',
  },
  description:
    'Wrap any React/Next.js subtree with plugin-driven analytics, flags, mount/visibility events, and custom actions.',
  metadataBase: new URL('https://drwyn.dev'),
  openGraph: {
    title: 'drwyn',
    description:
      'Wrap any React/Next.js subtree with plugin-driven analytics, flags, mount/visibility events, and custom actions.',
    url: 'https://drwyn.dev',
    siteName: 'drwyn',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'drwyn',
    description:
      'Wrap any React/Next.js subtree with plugin-driven analytics, flags, mount/visibility events, and custom actions.',
  },
}

const banner = (
  <Banner storageKey="drwyn-0-1-banner">
    drwyn v0.1 has shipped — early release, API may evolve.
  </Banner>
)

const navbar = (
  <Navbar
    logo={
      <span style={{ fontWeight: 700, letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
        drwyn
      </span>
    }
    projectLink="https://github.com/srj31/drwyn"
  />
)

const footer = (
  <Footer>
    MIT {new Date().getFullYear()} © drwyn contributors. Built with Nextra.
  </Footer>
)

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          banner={banner}
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/srj31/drwyn/blob/main/apps/docs"
          editLink="Edit this page on GitHub"
          sidebar={{ defaultMenuCollapseLevel: 1 }}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
