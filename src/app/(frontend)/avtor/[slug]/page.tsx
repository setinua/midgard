import type { Metadata } from 'next'
import { pageMeta } from '../../../../lib/seo'
import { notFound } from 'next/navigation'
import { Img } from '../../../../components/Img'
import { Crumbs, ListPage, type SP } from '../../../../components/ListPage'
import { SITE_URL } from '../../../../lib/constants'
import { bySlug, img } from '../../../../lib/data'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await bySlug('authors', (await params).slug)
  if (!a) return {}
  const photo = img(a.photo)
  return pageMeta({ title: a.seo?.title || (a.expertise ? `${a.name} — ${a.expertise}` : a.name), description: a.seo?.description || a.bio || a.expertise, path: `/avtor/${a.slug}`, type: 'profile', image: photo?.sizes?.og?.url ? { url: photo.sizes.og.url, width: 1200, height: 630, alt: a.name } : null })
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const a = await bySlug('authors', (await params).slug)
  if (!a) notFound()
  const ld = { '@context': 'https://schema.org', '@type': 'Person', name: a.name, jobTitle: a.expertise || undefined, description: a.bio || undefined, url: `${SITE_URL}/avtor/${a.slug}`, sameAs: (a.links || []).map((l) => l.url) }
  return (
    <ListPage
      title={a.name}
      base={`/avtor/${a.slug}`}
      sp={await searchParams}
      where={[{ authors: { in: [a.id] } }]}
      crumbs={<Crumbs items={[['Головна', '/'], ['Команда', '/komanda'], [a.name]]} />}
      intro={
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <Img media={img(a.photo)} size="thumb" className="th-96" sizes="96px" />
          <div>
            {a.expertise && <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--ink-900)' }}>{a.expertise}</p>}
            {a.bio && <p style={{ margin: '0 0 8px' }}>{a.bio}</p>}
            {(a.links || []).map((l) => <a key={l.url} href={l.url} rel="noopener me" target="_blank" style={{ color: 'var(--blue-600)', marginRight: 16 }}>{l.label}</a>)}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
          </div>
        </div>
      }
    />
  )
}
