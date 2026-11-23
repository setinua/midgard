import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Crumbs, ListPage, pageNoindex, type SP } from '../../../../components/ListPage'
import { SITE_URL } from '../../../../lib/constants'
import { bySlug } from '../../../../lib/data'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const r = await bySlug('epochs', (await params).slug)
  if (!r) return {}
  return { title: r.seo?.title || r.name, description: r.seo?.description || r.description || undefined, alternates: { canonical: `${SITE_URL}/epokha/${r.slug}` }, robots: pageNoindex(await searchParams) ? { index: false, follow: true } : undefined }
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
