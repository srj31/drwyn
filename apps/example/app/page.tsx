import Link from 'next/link'
import { PricingCta } from '@/components/pricing-cta'
import { FeatureTour } from '@/components/feature-tour'
import { NavList } from '@/components/nav-list'
import { CaptureDemo } from '@/components/capture-demo'

export default function HomePage() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-6 py-16 space-y-12">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">drwyn example</p>
          <h1 className="text-5xl font-bold tracking-tight">
            Software that evolves <br />for every user.
          </h1>
          <p className="text-lg text-fg-muted">
            Click around. The widgets remember what you use and adapt on the next page load.
            Open{' '}
            <Link href="/debug" className="text-accent underline-offset-4 hover:underline">
              /debug
            </Link>{' '}
            to inspect memory.
          </p>
        </header>

        <section aria-label="Navigation">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-fg-muted">
            Nav
          </h2>
          <NavList />
        </section>

        <section aria-label="Pricing">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-fg-muted">
            Pricing
          </h2>
          <PricingCta />
        </section>

        <section aria-label="Capture">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-fg-muted">
            Capture (snapshot store)
          </h2>
          <CaptureDemo />
        </section>

        <section className="rounded-xl border border-white/10 bg-surface-1 p-6">
          <h2 className="text-base font-semibold">How adaptation kicks in</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-fg-muted">
            <li>Each click on a widget records a use in IndexedDB (via the <code>memory</code> plugin).</li>
            <li>The <code>surface</code> plugin checks the count at <em>mount</em> time.</li>
            <li>Adaptation appears on the next route navigation — try{' '}
              <Link href="/debug" className="text-accent underline-offset-4 hover:underline">/debug</Link>{' '}then back.</li>
          </ol>
        </section>
      </main>
      <FeatureTour />
    </>
  )
}
