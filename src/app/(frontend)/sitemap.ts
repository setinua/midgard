import type { MetadataRoute } from 'next'
import { SITE_URL, ARTICLE_TYPES } from '../../lib/constants'
import { getTaxonomy, href, payload } from '../../lib/data'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const p = await payload()
  const [arts, authors, pages, tax] = await Promise.all([
    p.find({ collection: 'articles', where: { _status: { equals: 'published' }, publishedAt: { less_than_equal: new Date().toISOString() } }, limit: 50000, depth: 0, select: { slug: true, type: true, updatedAt: true }, pagination: false }),
    p.find({ collection: 'authors', limit: 1000, depth: 0, select: { slug: true }, pagination: false }),
    p.find({ collection: 'pages', where: { _status: { equals: 'published' } }, limit: 100, depth: 0, select: { slug: true }, pagination: false }),
    getTaxonomy(),
  ])
  const u = (path: string, lastModified?: string) => ({ url: `${SITE_URL}${path}`, lastModified })
  return [
    u('/'),
    ...ARTICLE_TYPES.map((t) => u(`/${t.path}`)),
    ...tax.regions.map((r) => u(`/region/${r.slug}`)),
    ...tax.epochs.map((e) => u(`/epokha/${e.slug}`)),
    ...pages.docs.map((x) => u(`/${x.slug}`)),
    ...authors.docs.map((x) => u(`/avtor/${x.slug}`)),
    ...arts.docs.map((a) => u(href(a as any), a.updatedAt)),
  ]
}
