import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Crumbs, ListPage, pageNoindex, type SP } from '../../../../components/ListPage'
import { bySlug, countArticles } from '../../../../lib/data'
import { MIN_ITEMS, pageMeta, tagDesc, tagTitle } from '../../../../lib/seo'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const t = await bySlug('tags', (await params).slug)
  if (!t) return {}
  const n = await countArticles([{ tags: { in: [t.id] } }])
  return pageMeta({ title: t.seo?.title || tagTitle(t.name), description: t.seo?.description || (t as { description?: string }).description || tagDesc(t.name), path: `/teh/${t.slug}`, noindex: n < MIN_ITEMS || pageNoindex(await searchParams) })
}

export default async function TagPage({ params, searchParams }: Props) {
  const t = await bySlug('tags', (await params).slug)
  if (!t) notFound()
  return <ListPage title={t.name} base={`/teh/${t.slug}`} sp={await searchParams} where={[{ tags: { in: [t.id] } }]} crumbs={<Crumbs items={[['Головна', '/'], [t.name]]} />} />
}
