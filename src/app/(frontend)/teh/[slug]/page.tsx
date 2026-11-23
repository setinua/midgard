import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Crumbs, ListPage, pageNoindex, type SP } from '../../../../components/ListPage'
import { SITE_URL } from '../../../../lib/constants'
import { bySlug } from '../../../../lib/data'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const t = await bySlug('tags', (await params).slug)
  return t ? { title: `Тег: ${t.name}`, alternates: { canonical: `${SITE_URL}/teh/${t.slug}` }, robots: pageNoindex(await searchParams) ? { index: false, follow: true } : undefined } : {}
}

export default async function TagPage({ params, searchParams }: Props) {
  const t = await bySlug('tags', (await params).slug)
  if (!t) notFound()
  return <ListPage title={`Тег: ${t.name}`} base={`/teh/${t.slug}`} sp={await searchParams} where={[{ tags: { in: [t.id] } }]} crumbs={<Crumbs items={[['Головна', '/'], [t.name]]} />} />
}
