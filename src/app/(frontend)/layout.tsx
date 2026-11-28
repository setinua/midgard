import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
// Source Serif 4 is used only for the logo (wordmark, tagline): Cyrillic + Latin only.
import '@fontsource/source-serif-4/cyrillic-600.css'
import '@fontsource/source-serif-4/cyrillic-700.css'
import '@fontsource/source-serif-4/latin-600.css'
import '@fontsource/source-serif-4/latin-700.css'
import './styles.css'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import Script from 'next/script'
import React from 'react'
import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { SITE_NAME, SITE_URL } from '../../lib/constants'
import { DEFAULT_OG, HOME_TITLE } from '../../lib/seo'
import { verificationCodes } from '../../lib/verification'
import { getAds, getSettings, getTaxonomy } from '../../lib/data'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const [s, ads] = await Promise.all([getSettings(), getAds()])
  const closed = process.env.SITE_NOINDEX === '1'
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: HOME_TITLE, template: `%s | ${SITE_NAME}` },
    description: s.description || undefined,
    alternates: { types: { 'application/rss+xml': `${SITE_URL}/rss.xml` } },
    openGraph: { siteName: SITE_NAME, locale: 'uk_UA', type: 'website', images: [DEFAULT_OG] },
    twitter: { card: 'summary_large_image', images: [DEFAULT_OG.url] },
    icons: { icon: [{ url: '/favicon.svg?v=2', type: 'image/svg+xml' }, { url: '/favicon.ico?v=2', sizes: '48x48' }], apple: '/apple-touch-icon.png?v=2' },
    // Search Console / Bing Webmaster ownership codes from «Налаштування».
    verification: {
      google: verificationCodes(s.googleVerification),
      other: verificationCodes(s.bingVerification) ? { 'msvalidate.01': verificationCodes(s.bingVerification)! } : undefined,
    },
    // AdSense site ownership (with public/ads.txt).
    other: ads?.adsenseClient ? { 'google-adsense-account': ads.adsenseClient.trim() } : undefined,
    robots: closed ? { index: false, follow: false } : { index: true, follow: true, 'max-image-preview': 'large' },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ regions, epochs }, s, dm] = await Promise.all([getTaxonomy(), getSettings(), draftMode()])
  const org = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: (s.social || []).map((x) => x.url),
  }
  const site = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: 'Midgard.news',
    url: SITE_URL,
    inLanguage: 'uk',
    potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/poshuk?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  }
  return (
    <html lang="uk">
      <body>
        {dm.isEnabled && (
          <div className="draft-bar" role="status">Режим перегляду: видно чернетки й незбережені для читачів зміни · <a href="/pereglyad?exit=1">Вийти</a></div>
        )}
        <Header regions={regions} epochs={epochs} social={(s.social || []) as { network: string; url: string }[]} />
        <main id="main">{children}</main>
        <Footer description={s.description} copyright={s.copyright} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([org, site]) }} />
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
