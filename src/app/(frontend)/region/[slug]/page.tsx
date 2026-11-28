import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Crumbs, ListPage, pageNoindex, type SP } from '../../../../components/ListPage'
import { bySlug, countArticles } from '../../../../lib/data'
import { MIN_ITEMS, pageMeta, regionDesc, regionTitle } from '../../../../lib/seo'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const r = await bySlug('regions', (await params).slug)
  if (!r) return {}
  const n = await countArticles([{ or: [{ primaryRegion: { equals: r.id } }, { regions: { in: [r.id] } }] }])
  return pageMeta({ title: r.seo?.title || regionTitle(r.slug, r.name), description: r.seo?.description || r.description || regionDesc(r.slug, r.name), path: `/region/${r.slug}`, noindex: n < MIN_ITEMS || pageNoindex(await searchParams) })
}

export default async function RegionPage({ params, searchParams }: Props) {
  const r = await bySlug('regions', (await params).slug)
  if (!r) notFound()
  return (
    <ListPage
      title={r.name}
      intro={r.description}
      base={`/region/${r.slug}`}
      sp={await searchParams}
      where={[{ or: [{ primaryRegion: { equals: r.id } }, { regions: { in: [r.id] } }] }]}
      filters={['epokha', 'typ']}
      crumbs={<Crumbs items={[['Головна', '/'], ['Регіони світу'], [r.name]]} />}
    />
  )
}
