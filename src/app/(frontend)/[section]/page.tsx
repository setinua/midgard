import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Img } from '../../../components/Img'
import { Crumbs, ListPage, pageNoindex, type SP } from '../../../components/ListPage'
import { Prose } from '../../../components/Prose'
import { SITE_URL, typeByPath } from '../../../lib/constants'
import { bySlug, img, payload, type Author } from '../../../lib/data'

type Props = { params: Promise<{ section: string }>; searchParams: Promise<SP> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { section } = await params
  const sp = await searchParams
  const t = typeByPath(section)
  if (t) return { title: t.label, alternates: { canonical: `${SITE_URL}/${t.path}` }, robots: pageNoindex(sp) ? { index: false, follow: true } : undefined }
  const p = await bySlug('pages', section)
  return p ? { title: p.seo?.title || p.title, description: p.seo?.description || p.intro || undefined } : {}
}

export default async function Section({ params, searchParams }: Props) {
  const { section } = await params
  const sp = await searchParams
  const t = typeByPath(section)
  if (t) {
    return (
      <ListPage
        title={t.label}
        base={`/${t.path}`}
        sp={sp}
        where={[{ type: { equals: t.value } }]}
        filters={['region', 'epokha']}
        crumbs={<Crumbs items={[['Головна', '/'], [t.label]]} />}
      />
    )
  }
  const page = await bySlug('pages', section)
  if (!page) notFound()
  let team: Author[] = []
  if (section === 'komanda') {
    const p = await payload()
    team = (await p.find({ collection: 'authors', where: { inTeam: { equals: true } }, sort: 'order', limit: 100, depth: 1 })).docs as Author[]
  }
  return (
    <div className="wrap page" style={{ paddingTop: 20 }}>
      <Crumbs items={[['Головна', '/'], [page.title]]} />
      <h1 className="h1p">{page.title}</h1>
      {page.intro && <p className="intro">{page.intro}</p>}
      <Prose data={page.content} />
      {team.length > 0 && (
        <div className="t2" style={{ marginTop: 24 }}>
          {team.map((a) => (
            <Link key={a.id} href={`/avtor/${a.slug}`} className="li" style={{ alignItems: 'center' }}>
              <Img media={img(a.photo)} size="thumb" className="av-48" sizes="48px" />
              <span><span className="h-card">{a.name}</span><br /><span className="meta">{a.expertise}</span></span>
            </Link>
          ))}
        </div>
      )}
      {!page.content && !page.intro && team.length === 0 && <p className="empty">Сторінка заповнюється.</p>}
    </div>
  )
}
