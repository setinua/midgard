import { SITE_NAME, typeByPath } from '../../../../../lib/constants'
import { bySlug } from '../../../../../lib/data'
import { findArticles, rss, xml } from '../../../../../lib/feeds'

export const dynamic = 'force-dynamic'

// /rss/typ/<type>, /rss/region/<slug>, /rss/epokha/<slug>
export async function GET(_: Request, { params }: { params: Promise<{ kind: string; slug: string }> }) {
  const { kind, slug } = await params
  const self = `/rss/${kind}/${slug}`
  if (kind === 'typ') {
    const t = typeByPath(slug)
    if (!t) return new Response('Not found', { status: 404 })
    return xml(rss(`${SITE_NAME}: ${t.label}`, (await findArticles({ where: [{ type: { equals: t.value } }], limit: 50 })).docs, self))
  }
  if (kind === 'region' || kind === 'epokha') {
    const doc = await bySlug(kind === 'region' ? 'regions' : 'epochs', slug)
    if (!doc) return new Response('Not found', { status: 404 })
    const f = kind === 'region' ? ['primaryRegion', 'regions'] : ['primaryEpoch', 'epochs']
    const where = [{ or: [{ [f[0]]: { equals: doc.id } }, { [f[1]]: { in: [doc.id] } }] }]
    return xml(rss(`${SITE_NAME}: ${doc.name}`, (await findArticles({ where, limit: 50 })).docs, self))
  }
  return new Response('Not found', { status: 404 })
}
