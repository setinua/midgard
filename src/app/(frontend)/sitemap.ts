import type { MetadataRoute } from 'next'
import { SITE_URL, ARTICLE_TYPES } from '../../lib/constants'
import { getTaxonomy, href, payload, taxonomyCounts } from '../../lib/data'
import { MIN_ITEMS, NOINDEX_PAGES } from '../../lib/seo'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const p = await payload()
  const [arts, authors, pages, tax, counts, tags] = await Promise.all([
    p.find({ collection: 'articles', where: { _status: { equals: 'published' }, publishedAt: { less_than_equal: new Date().toISOString() } }, limit: 50000, depth: 0, select: { slug: true, type: true, updatedAt: true }, pagination: false }),
    p.find({ collection: 'authors', limit: 1000, depth: 0, select: { slug: true }, pagination: false }),
    p.find({ collection: 'pages', where: { _status: { equals: 'published' } }, limit: 100, depth: 0, select: { slug: true }, pagination: false }),
    getTaxonomy(),
    taxonomyCounts(),
    p.find({ collection: 'tags', limit: 1000, depth: 0, select: { slug: true }, pagination: false }),
  ])
  const enough = (bucket: Record<number, number>, id: number) => (bucket[id] || 0) >= MIN_ITEMS
  const u = (path: string, lastModified?: string) => ({ url: `${SITE_URL}${path}`, lastModified })
  return [
    u('/'),
    ...ARTICLE_TYPES.map((t) => u(`/${t.path}`)),
    ...tax.regions.filter((r) => enough(counts.regions, r.id)).map((r) => u(`/region/${r.slug}`)),
    ...tax.epochs.filter((e) => enough(counts.epochs, e.id)).map((e) => u(`/epokha/${e.slug}`)),
    ...tags.docs.filter((t) => enough(counts.tags, t.id)).map((t) => u(`/teh/${t.slug}`)),
    ...pages.docs.filter((x) => !NOINDEX_PAGES.includes(x.slug as string)).map((x) => u(`/${x.slug}`)),
    ...authors.docs.map((x) => u(`/avtor/${x.slug}`)),
    ...arts.docs.map((a) => u(href(a as any), a.updatedAt)),
  ]
}
