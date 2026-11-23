import { SITE_NAME, SITE_TAGLINE, SITE_URL } from './constants'
import { authorNames, findArticles, href, img, type Card } from './data'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function rss(title: string, items: Card[], self: string) {
  const body = items
    .map((a) => {
      const m = img(a.hero)
      const pic = m?.sizes?.card?.url || m?.url
      return `<item><title>${esc(a.title)}</title><link>${SITE_URL}${href(a)}</link><guid isPermaLink="true">${SITE_URL}${href(a)}</guid><pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate><dc:creator>${esc(authorNames(a))}</dc:creator><description>${esc(a.lead || '')}</description>${pic ? `<enclosure url="${esc(pic.startsWith('http') ? pic : SITE_URL + pic)}" type="image/webp" length="0"/>` : ''}</item>`
    })
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(title)}</title><link>${SITE_URL}</link><description>${esc(SITE_NAME + ' — ' + SITE_TAGLINE)}</description><language>uk</language><atom:link href="${SITE_URL}${self}" rel="self" type="application/rss+xml"/>${body}</channel></rss>`
}

export const xml = (body: string, type = 'application/rss+xml') =>
  new Response(body, { headers: { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'public, max-age=300' } })

export { findArticles }
