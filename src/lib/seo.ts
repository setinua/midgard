import type { Metadata } from 'next'
import { SITE_NAME, SITE_URL } from './constants'

// SEO rules (see docs/SEO.md). Admin "SEO" fields win; otherwise these templates apply.
export const TITLE_MAX = 60
export const DESC_MAX = 155
export const DEFAULT_OG = { url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: `${SITE_NAME} — новини археології України та світу` }

const BRAND = ` | ${SITE_NAME}`

/** Title with the brand only when the whole thing fits in TITLE_MAX characters. */
export const fitTitle = (title: string) => {
  const t = clean(title)
  return t.length + BRAND.length <= TITLE_MAX ? t + BRAND : t
}

const clean = (s: string) => s.replace(/\s+/g, ' ').replace(/"([^"]*)"/g, '«$1»').trim()

/** Description: whole sentences up to DESC_MAX characters; a single long sentence is cut at a word. */
export const fitDesc = (text?: string | null, max = DESC_MAX) => {
  if (!text) return undefined
  const s = clean(text)
  if (s.length <= max) return s
  const sentences = s.match(/[^.!?…]+[.!?…]+[»"]?\s*/g) || []
  let out = ''
  for (const x of sentences) {
    if ((out + x).trim().length > max) break
    out += x
  }
  out = out.trim()
  if (out.length >= 70) return out
  const cut = s.slice(0, max - 1)
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:—–-]+$/, '') + '…'
}

type Image = { url: string; width?: number | null; height?: number | null; alt?: string | null }

/** Full metadata for a page: title, description, canonical, Open Graph, Twitter, robots. */
export function pageMeta(o: {
  title: string
  description?: string | null
  path: string
  image?: Image | null
  noindex?: boolean
  type?: 'website' | 'article' | 'profile'
  article?: { publishedTime?: string; modifiedTime?: string; section?: string; tags?: string[]; authors?: string[] }
  absoluteTitle?: boolean
}): Metadata {
  const title = o.absoluteTitle ? clean(o.title) : fitTitle(o.title)
  const description = fitDesc(o.description)
  const url = `${SITE_URL}${o.path === '/' ? '' : o.path}` || SITE_URL
  const image = o.image?.url ? { url: o.image.url, width: o.image.width || undefined, height: o.image.height || undefined, alt: o.image.alt || o.title } : DEFAULT_OG
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url, types: { 'application/rss+xml': `${SITE_URL}/rss.xml` } },
    openGraph: {
      siteName: SITE_NAME,
      locale: 'uk_UA',
      url,
      title: o.title,
      description,
      images: [image],
      ...(o.type === 'article'
        ? { type: 'article', publishedTime: o.article?.publishedTime, modifiedTime: o.article?.modifiedTime, section: o.article?.section, tags: o.article?.tags, authors: o.article?.authors }
        : { type: o.type || 'website' }),
    },
    twitter: { card: 'summary_large_image', title: o.title, description, images: [image.url] },
    robots: o.noindex ? { index: false, follow: true } : undefined,
  }
}

/** Taxonomy and tag pages with fewer materials than this stay out of the index and the sitemap. */
export const MIN_ITEMS = 3

// Region names for title/description templates: genitive ("Археологія Європи") and locative ("в Європі").
const REGION_FORMS: Record<string, [string, string]> = {
  yevropa: ['Європи', 'в Європі'],
  aziia: ['Азії', 'в Азії'],
  afryka: ['Африки', 'в Африці'],
  'pivnichna-amerika': ['Північної Америки', 'у Північній Америці'],
  'pivdenna-amerika': ['Південної Америки', 'у Південній Америці'],
  'avstraliia-ta-okeaniia': ['Австралії та Океанії', 'в Австралії та Океанії'],
  ukraina: ['України', 'в Україні'],
}
export const regionForms = (slug: string, name: string): [string, string] => REGION_FORMS[slug] || [name, `у регіоні ${name}`]

export const regionTitle = (slug: string, name: string) => `Археологія ${regionForms(slug, name)[0]}: новини і відкриття`
export const regionDesc = (slug: string, name: string) =>
  `Археологічні відкриття ${regionForms(slug, name)[1]}: розкопки, знахідки й нові дослідження від палеоліту до сучасності. Новини та статті «Мідгарду».`
export const epochTitle = (name: string) => `${name}: археологічні відкриття і новини`
export const epochDesc = (name: string, period?: string | null) =>
  `${name}${period ? ` (${period})` : ''}: новини археології, відкриття й статті про знахідки цієї доби в Україні та світі.`
export const tagTitle = (name: string) => `${name}: новини та статті`
export const tagDesc = (name: string) => `Усе про тему «${name}» на «Мідгарді»: новини археології, відкриття, розкопки й статті з посиланнями на джерела.`

// Section pages: search titles (the menu keeps short names).
export const SECTION_TITLES: Record<string, string> = {
  news: 'Новини археології: відкриття і розкопки',
  publication: 'Статті про археологію та давні культури',
  interview: 'Інтерв’ю з археологами та істориками',
  special: 'Спецпроєкти про археологію України',
  partner: 'Партнерські матеріали',
}

// Service pages kept out of the index (trust pages — about, team, editorial policy, contacts — stay indexed).
export const NOINDEX_PAGES = ['polityka-konfidentsiinosti']

export const HOME_TITLE = `${SITE_NAME} — новини археології України та світу`
export const HOME_DESC =
  'Новини археології, відкриття, розкопки й інтерв’ю з дослідниками. Достовірно, з посиланнями на наукові джерела — без конспірології і «чорних копачів».'

type MediaLike = { id?: number | string; url?: string | null; alt?: string | null; sizes?: { og?: { url?: string | null } | null } | null } | null | undefined

/** Social image for a photo: its generated "og" size, or a 1200×630 JPEG made on demand (/og/<id>.jpg). */
export const ogImage = (m: MediaLike, alt?: string | null) => {
  if (!m?.url || m.id == null) return null
  const url = m.sizes?.og?.url || `${SITE_URL}/og/${m.id}.jpg`
  return { url: url.startsWith('http') ? url : `${SITE_URL}${url}`, width: 1200, height: 630, alt: m.alt || alt || null }
}
