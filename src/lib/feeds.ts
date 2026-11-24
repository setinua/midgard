import { SITE_NAME, SITE_TAGLINE, SITE_URL } from './constants'
import { authorNames, findArticles, href, img, type Card } from './data'

// Escapes XML and drops control characters that XML forbids.
const esc = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Feed image: the 1200×630 JPEG (best supported by readers and aggregators) with its real size in bytes.
function enclosure(a: Card): string {
  const m = img(a.hero)
  if (!m) return ''
  const pick = [m.sizes?.og, m.sizes?.lead, m.sizes?.card, m].find((x) => x?.url)
  if (!pick?.url) return ''
  const url = pick.url.startsWith('http') ? pick.url : SITE_URL + pick.url
  return `<enclosure url="${esc(url)}" type="${esc(pick.mimeType || 'image/jpeg')}" length="${pick.filesize || 0}"/>`
}

export function rss(title: string, items: Card[], self: string) {
  const body = items
    .map((a) => {
      return `<item><title>${esc(a.title)}</title><link>${SITE_URL}${href(a)}</link><guid isPermaLink="true">${SITE_URL}${href(a)}</guid><pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate><dc:creator>${esc(authorNames(a))}</dc:creator>${a.type === 'partner' ? '<category>Реклама</category>' : ''}<description>${esc(a.lead || '')}</description>${enclosure(a)}</item>`
    })
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(title)}</title><link>${SITE_URL}</link><description>${esc(SITE_NAME + ' — ' + SITE_TAGLINE)}</description><language>uk</language>${items[0] ? `<lastBuildDate>${new Date(items[0].publishedAt).toUTCString()}</lastBuildDate>` : ''}<atom:link href="${SITE_URL}${self}" rel="self" type="application/rss+xml"/>${body}</channel></rss>`
}

export const xml = (body: string, type = 'application/rss+xml') =>
  new Response(body, { headers: { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'public, max-age=300' } })

export { findArticles }
