import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/source-serif-4/600.css'
import '@fontsource/source-serif-4/700.css'
import './styles.css'
import type { Metadata } from 'next'
import Script from 'next/script'
import React from 'react'
import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from '../../lib/constants'
import { getSettings, getTaxonomy } from '../../lib/data'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings()
  const closed = process.env.SITE_NOINDEX === '1'
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${SITE_NAME} — ${SITE_TAGLINE.toLowerCase()}`, template: `%s — ${SITE_NAME}` },
    description: s.description || undefined,
    alternates: { types: { 'application/rss+xml': `${SITE_URL}/rss.xml` } },
    openGraph: { siteName: SITE_NAME, locale: 'uk_UA', type: 'website' },
    icons: { icon: [{ url: '/favicon.svg?v=2', type: 'image/svg+xml' }, { url: '/favicon.ico?v=2', sizes: '48x48' }], apple: '/apple-touch-icon.png?v=2' },
    robots: closed ? { index: false, follow: false } : { index: true, follow: true, 'max-image-preview': 'large' },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ regions, epochs }, s] = await Promise.all([getTaxonomy(), getSettings()])
  const org = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: (s.social || []).map((x) => x.url),
  }
  return (
    <html lang="uk">
      <body>
        <Header regions={regions} epochs={epochs} social={(s.social || []) as { network: string; url: string }[]} />
        <main id="main">{children}</main>
        <Footer description={s.description} copyright={s.copyright} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }} />
        {s.gaId && process.env.SITE_NOINDEX !== '1' && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${s.gaId}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied'});gtag('js',new Date());gtag('config','${s.gaId}');`}</Script>
          </>
        )}
      </body>
    </html>
  )
}
