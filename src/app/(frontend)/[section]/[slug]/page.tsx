import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AdLabel, NewsList, SectionHead, ThumbList } from '../../../../components/Blocks'
import { EditButton } from '../../../../components/EditButton'
import { Icon } from '../../../../components/Icons'
import { Img } from '../../../../components/Img'
import { Prose } from '../../../../components/Prose'
import { SITE_NAME, SITE_URL, typeByPath } from '../../../../lib/constants'
import { authorNames, getArticle, getRelated, getSidebar, href, img, rel, type Author, type Epoch, type Region, type Tag } from '../../../../lib/data'
import { date, dateTime } from '../../../../lib/format'
import { DEFAULT_OG, DESC_MAX, fitDesc, pageMeta } from '../../../../lib/seo'

type Props = { params: Promise<{ section: string; slug: string }> }

async function load(p: Props['params']) {
  const { section, slug } = await p
  const t = typeByPath(section)
  if (!t) return null
  const a = await getArticle(t.value, slug)
  return a ? { a, t } : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await load(params)
  if (!r) return {}
  const { a, t } = r
  const hero = img(a.hero)
  const og = hero?.sizes?.og?.url ? { url: hero.sizes.og.url, width: 1200, height: 630, alt: hero.alt } : null
  const tags = (a.tags || []).map((x) => rel<Tag>(x)?.name).filter(Boolean) as string[]
  const authors = (a.authors || []).map((x) => rel<Author>(x)).filter(Boolean) as Author[]
  const desc = a.seo?.description || a.lead
  return pageMeta({
    title: a.seo?.title || a.title,
    description: a.type === 'partner' && !a.seo?.description ? `${fitDesc(desc, DESC_MAX - 26) || ''} Партнерський матеріал.` : desc,
    path: href(a),
    image: og,
    type: 'article',
    article: {
      publishedTime: a.publishedAt,
      modifiedTime: a.contentUpdatedAt || a.updatedAt,
      section: t.label,
      tags,
      authors: authors.map((x) => `${SITE_URL}/avtor/${x.slug}`),
    },
  })
}

export default async function ArticlePage({ params }: Props) {
  const r = await load(params)
  if (!r) notFound()
  const { a, t } = r
  const region = rel<Region>(a.primaryRegion)
  const epoch = rel<Epoch>(a.primaryEpoch)
  const hero = img(a.hero)
  const authors = (a.authors || []).map((x) => rel<Author>(x)).filter(Boolean) as Author[]
  const extraRegions = (a.regions || []).map((x) => rel<Region>(x)).filter((x): x is Region => !!x && x.id !== region?.id)
  const extraEpochs = (a.epochs || []).map((x) => rel<Epoch>(x)).filter((x): x is Epoch => !!x && x.id !== epoch?.id)
  const tags = (a.tags || []).map((x) => rel<Tag>(x)).filter(Boolean) as Tag[]
  const [related, side] = await Promise.all([getRelated(a), getSidebar(a.id)])
  const url = `${SITE_URL}${href(a)}`
  const special = a.type === 'special'

  const ld = {
    '@context': 'https://schema.org',
    '@type': a.type === 'news' ? 'NewsArticle' : 'Article',
    headline: a.title,
    description: a.lead,
    datePublished: a.publishedAt,
    dateModified: a.contentUpdatedAt || a.updatedAt,
    image: [hero?.sizes?.lead?.url, hero?.sizes?.og?.url].filter(Boolean).length ? [hero?.sizes?.lead?.url, hero?.sizes?.og?.url].filter(Boolean) : [DEFAULT_OG.url],
    articleSection: t.label,
    keywords: tags.map((x) => x.name).join(', ') || undefined,
    author: authors.length ? authors.map((x) => ({ '@type': 'Person', name: x.name, url: `${SITE_URL}/avtor/${x.slug}` })) : { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'NewsMediaOrganization', name: SITE_NAME, url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } },
    mainEntityOfPage: url,
    isAccessibleForFree: true,
  }
  const crumbs = [
    { name: 'Головна', url: '/' },
    { name: t.label, url: `/${t.path}` },
    region && { name: region.name, url: `/region/${region.slug}` },
    epoch && { name: epoch.name, url: `/epokha/${epoch.slug}` },
  ].filter(Boolean) as { name: string; url: string }[]
  const crumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: `${SITE_URL}${c.url}` })),
  }

  const body = (
    <article>
      {t.value === 'partner' && (
        <p className="meta" style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 0 }}>
          <AdLabel /> {a.sponsor && <span>Замовник: {a.sponsor}</span>}
        </p>
      )}
      <h1 className="h1a">{a.title}</h1>
      <p className="lede">{a.lead}</p>
      <div className="metabar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, font: '500 14px var(--sans)' }}>
          {authors[0] && <Img media={img(authors[0].photo)} size="thumb" className="av-48" sizes="48px" />}
          <span>
            {authors.length ? (
              authors.map((x, i) => (
                <span key={x.id}>{i > 0 && ', '}<Link href={`/avtor/${x.slug}`} style={{ color: 'var(--blue-600)' }}>{x.name}</Link></span>
              ))
            ) : (
              <span>{a.byline}</span>
            )}
            <br />
            <span className="meta">
              <time dateTime={a.publishedAt}>{dateTime(a.publishedAt)}</time>
              {a.contentUpdatedAt && <> · оновлено {dateTime(a.contentUpdatedAt)}</>}
            </span>
          </span>
        </div>
        <div className="share">
          <a href="https://www.facebook.com/mchaikovskiy" target="_blank" rel="noopener" aria-label="Мідгард у Facebook"><Icon.facebook /></a>
        </div>
      </div>
      {a.type === 'interview' && a.interviewee?.name && (
        <div className="person">
          <Img media={img(a.interviewee.photo)} size="thumb" className="av-48" sizes="48px" />
          <span><strong>{a.interviewee.name}</strong><br /><span className="meta">{a.interviewee.title}</span></span>
        </div>
      )}
      {hero && (
        <figure className="hero">
          <Img media={hero} size="lead" sizes="(max-width: 1023px) 100vw, 760px" priority />
          <figcaption>{[hero.caption, hero.credit && `Фото: ${hero.credit}`].filter(Boolean).join('. ')}</figcaption>
        </figure>
      )}
      <Prose data={a.content} sponsored={a.type === 'partner'} />
      {a.sources && a.sources.length > 0 && (
        <aside className="sources" aria-labelledby="sources-h">
          <h2 id="sources-h" className="sources-h">{a.sources.length > 1 ? 'Джерела' : 'Джерело'}</h2>
          <ul>
            {a.sources.map((s, i) => {
              const title = s.title.trim().replace(/[\s.;,]+$/, '')
              let host = ''
              try { if (s.url) host = new URL(s.url).hostname.replace(/^www\./, '') } catch {}
              return (
                <li key={s.id || i}>
                  {s.url ? <a href={s.url} target="_blank" rel={t.value === 'partner' ? 'sponsored noopener' : 'noopener'}>{title}</a> : title}
                  {host && <span className="sources-host">{host}</span>}
                </li>
              )
            })}
          </ul>
        </aside>
      )}
      {(tags.length > 0 || extraRegions.length > 0 || extraEpochs.length > 0) && (
        <div className="chips">
          <span style={{ color: 'var(--ink-600)' }}>Теги:</span>
          {tags.map((x) => <Link key={`t${x.id}`} className="chip" href={`/teh/${x.slug}`}>{x.name}</Link>)}
          {extraRegions.map((x) => <Link key={`r${x.id}`} className="chip" href={`/region/${x.slug}`}>{x.name}</Link>)}
          {extraEpochs.map((x) => <Link key={`e${x.id}`} className="chip" href={`/epokha/${x.slug}`}>{x.name}</Link>)}
        </div>
      )}
      {related.length > 0 && (
        <section>
          <SectionHead title="Читайте також" />
          <div className="ra">
            {related.map((x) => (
              <Link key={x.id} href={href(x)} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Img media={img(x.hero)} size="card" className="ra-img" sizes="(max-width: 1023px) 50vw, 200px" />
                <span className="h-card">{x.title}</span>
                <span className="meta">{date(x.publishedAt)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <EditButton id={a.id} />
    </article>
  )

  return (
    <div className="wrap page" style={{ paddingTop: 20 }}>
      <nav aria-label="Навігаційний ланцюжок" className="crumbs">
        {crumbs.map((c, i) => (
          <span key={c.url} style={{ display: 'flex', gap: 8 }}>{i > 0 && '›'}<Link href={c.url}>{c.name}</Link></span>
        ))}
      </nav>
      {special ? (
        body
      ) : (
        <div className="ag">
          {body}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              <SectionHead title="Останні новини" level={2} />
              <NewsList items={side.news} />
              <Link href="/novyny" className="more more-block">Усі новини →</Link>
            </div>
            {side.popular.length > 0 && (
              <div>
                <SectionHead title="Популярні" />
                <ThumbList items={side.popular} size={96} />
              </div>
            )}
          </aside>
        </div>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }} />
    </div>
  )
}
