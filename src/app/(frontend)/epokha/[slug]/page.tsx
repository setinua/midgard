import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Crumbs, ListPage, pageNoindex, type SP } from '../../../../components/ListPage'
import { bySlug, countArticles } from '../../../../lib/data'
import { MIN_ITEMS, epochDesc, epochTitle, pageMeta } from '../../../../lib/seo'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const r = await bySlug('epochs', (await params).slug)
  if (!r) return {}
  const n = await countArticles([{ or: [{ primaryEpoch: { equals: r.id } }, { epochs: { in: [r.id] } }] }])
  return pageMeta({ title: r.seo?.title || epochTitle(r.name), description: r.seo?.description || r.description || epochDesc(r.name, r.period), path: `/epokha/${r.slug}`, noindex: n < MIN_ITEMS || pageNoindex(await searchParams) })
}

export default async function EpochPage({ params, searchParams }: Props) {
  const r = await bySlug('epochs', (await params).slug)
  if (!r) notFound()
  return (
    <ListPage
      title={r.name}
      intro={[r.period, r.description].filter(Boolean).join('. ')}
      base={`/epokha/${r.slug}`}
      sp={await searchParams}
      where={[{ or: [{ primaryEpoch: { equals: r.id } }, { epochs: { in: [r.id] } }] }]}
      filters={['region', 'typ']}
      crumbs={<Crumbs items={[['Головна', '/'], ['Епохи'], [r.name]]} />}
    />
  )
}
