import Link from 'next/link'
import type { Where } from 'payload'
import type { ReactNode } from 'react'
import { ARTICLE_TYPES, typeByValue } from '../lib/constants'
import { findArticles, getTaxonomy, href, img, rel, type Epoch, type Region } from '../lib/data'
import { date } from '../lib/format'
import { AdSlot } from './Ad'
import { AdLabel, Empty } from './Blocks'
import { Img } from './Img'

export type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || ''

// Generic list of materials with filters and pagination. `fixed` filters come from the page itself.
export async function ListPage({
  title,
  intro,
  base,
  sp,
  where = [],
  filters = [],
  crumbs,
  aside,
  before,
  ads = true,
}: {
  title: string
  intro?: ReactNode
  base: string
  sp: SP
  where?: Where[]
  filters?: ('region' | 'epokha' | 'typ')[]
  crumbs?: ReactNode
  aside?: ReactNode
  before?: ReactNode
  /** Banner places (off for search). */
  ads?: boolean
}) {
  const { regions, epochs } = await getTaxonomy()
  const page = Math.max(1, parseInt(one(sp.page)) || 1)
  const f = { region: one(sp.region), epokha: one(sp.epokha), typ: one(sp.typ) }
  const w: Where[] = [...where]
  const rg = regions.find((r) => r.slug === f.region)
  const ep = epochs.find((e) => e.slug === f.epokha)
  const ty = ARTICLE_TYPES.find((t) => t.path === f.typ)
  if (filters.includes('region') && rg) w.push({ or: [{ primaryRegion: { equals: rg.id } }, { regions: { in: [rg.id] } }] })
  if (filters.includes('epokha') && ep) w.push({ or: [{ primaryEpoch: { equals: ep.id } }, { epochs: { in: [ep.id] } }] })
  if (filters.includes('typ') && ty) w.push({ type: { equals: ty.value } })
  const res = await findArticles({ where: w, page })

  const qs = (p: number) => {
    const u = new URLSearchParams()
    for (const k of filters) if (f[k]) u.set(k, f[k])
    if (sp.q) u.set('q', one(sp.q))
    if (p > 1) u.set('page', String(p))
    const s = u.toString()
    return s ? `${base}?${s}` : base
  }

  return (
    <div className="wrap page" style={{ paddingTop: 20 }}>
      {crumbs}
      <h1 className="h1p">{title}</h1>
      {intro && <div className="intro">{intro}</div>}
      {ads && <AdSlot slot="top" />}
      {before}
      {filters.length > 0 && (
        <form className="filters" method="get" action={base}>
          {filters.includes('epokha') && (
            <label>Епоха
              <select name="epokha" defaultValue={f.epokha}>
                <option value="">Усі епохи</option>
                {epochs.map((e) => <option key={e.slug} value={e.slug}>{e.name}</option>)}
              </select>
            </label>
          )}
          {filters.includes('region') && (
            <label>Регіон
              <select name="region" defaultValue={f.region}>
                <option value="">Усі регіони</option>
                {regions.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
              </select>
            </label>
          )}
          {filters.includes('typ') && (
            <label>Тип
              <select name="typ" defaultValue={f.typ}>
                <option value="">Усі типи</option>
                {ARTICLE_TYPES.map((t) => <option key={t.path} value={t.path}>{t.label}</option>)}
              </select>
            </label>
          )}
          <button className="btn" type="submit">Показати</button>
          <span className="meta" style={{ marginLeft: 'auto' }}>Матеріалів: {res.totalDocs}</span>
        </form>
      )}
      <div className={aside ? 'ag' : ''}>
        <div>
          {res.docs.length === 0 && <Empty>Матеріалів поки немає.</Empty>}
          {res.docs.map((a, i) => {
            const t = typeByValue(a.type)
            const k = [rel<Epoch>(a.primaryEpoch)?.name, t?.single].filter(Boolean).join(' · ')
            const row = (
              <Link key={a.id} href={href(a)} className="row-item">
                <Img media={img(a.hero)} size="card" className="row-thumb" sizes="(max-width: 767px) 112px, 240px" />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span className="kicker" style={{ fontSize: 12 }}>{k}{a.type === 'partner' && <> <AdLabel /></>}</span>
                  <span className="h-row">{a.title}</span>
                  <span className="l-row">{a.lead}</span>
                  <span className="meta">{date(a.publishedAt)}{rel<Region>(a.primaryRegion) ? ` · ${rel<Region>(a.primaryRegion)!.name}` : ''}</span>
                </span>
              </Link>
            )
            // Banner 2: once, after the 6th material (only when more follow).
            return ads && i === 5 && res.docs.length > 6 ? [row, <AdSlot key="ad-middle" slot="middle" />] : row
          })}
          {res.totalPages > 1 && (
            <nav className="pager" aria-label="Сторінки">
              {page > 1 && <Link href={qs(page - 1)} rel="prev">← Назад</Link>}
              {Array.from({ length: res.totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === res.totalPages)
                .map((p) => (p === page ? <span key={p} aria-current="page">{p}</span> : <Link key={p} href={qs(p)}>{p}</Link>))}
              {page < res.totalPages && <Link href={qs(page + 1)} rel="next">Далі →</Link>}
            </nav>
          )}
          {ads && res.docs.length > 0 && <AdSlot slot="bottom" />}
        </div>
        {aside}
      </div>
    </div>
  )
}

export function Crumbs({ items }: { items: [string, string?][] }) {
  return (
    <nav aria-label="Навігаційний ланцюжок" className="crumbs">
      {items.map(([name, url], i) => (
        <span key={name} style={{ display: 'flex', gap: 8 }}>{i > 0 && '›'}{url ? <Link href={url}>{name}</Link> : <span>{name}</span>}</span>
      ))}
    </nav>
  )
}

export const pageNoindex = (sp: SP) => Boolean(one(sp.page) && one(sp.page) !== '1') || Boolean(one(sp.region) || one(sp.epokha) || one(sp.typ))
