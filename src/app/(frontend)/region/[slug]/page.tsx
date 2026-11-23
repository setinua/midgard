import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Crumbs, ListPage, pageNoindex, type SP } from '../../../../components/ListPage'
import { SITE_URL } from '../../../../lib/constants'
import { bySlug } from '../../../../lib/data'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const r = await bySlug('regions', (await params).slug)
  if (!r) return {}
  return { title: r.seo?.title || r.name, description: r.seo?.description || r.description || undefined, alternates: { canonical: `${SITE_URL}/region/${r.slug}` }, robots: pageNoindex(await searchParams) ? { index: false, follow: true } : undefined }
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
