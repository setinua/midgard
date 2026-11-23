import { SITE_NAME, SITE_URL } from '../../../lib/constants'
import { findArticles, href } from '../../../lib/data'
import { xml } from '../../../lib/feeds'

export const dynamic = 'force-dynamic'
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Google News sitemap: last 2 days, no partner materials.
export async function GET() {
  const since = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  const { docs } = await findArticles({ where: [{ publishedAt: { greater_than: since } }, { type: { not_equals: 'partner' } }], limit: 1000 })
  const urls = docs
    .map((a) => `<url><loc>${SITE_URL}${href(a)}</loc><news:news><news:publication><news:name>${esc(SITE_NAME)}</news:name><news:language>uk</news:language></news:publication><news:publication_date>${a.publishedAt}</news:publication_date><news:title>${esc(a.title)}</news:title></news:news></url>`)
    .join('')
  return xml(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}</urlset>`, 'application/xml')
}
