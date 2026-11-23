import type { Metadata } from 'next'
import Link from 'next/link'
import { Crumbs } from '../../../components/ListPage'
import { sql } from '@payloadcms/db-postgres'
import { payload } from '../../../lib/data'

export const metadata: Metadata = { title: 'Архів' }
const MONTHS = ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень']

export default async function Archive() {
  const p = await payload()
  // Group published materials by year and month (Kyiv time).
  const res = await (p.db as any).drizzle.execute(
    sql`select extract(year from published_at at time zone 'Europe/Kyiv')::int as y, extract(month from published_at at time zone 'Europe/Kyiv')::int as m, count(*)::int as n from articles where _status = 'published' and published_at <= now() group by 1, 2 order by 1 desc, 2 desc`,
  )
  const rows = ((res as any).rows || res) as { y: number; m: number; n: number }[]
  const years = [...new Set(rows.map((r) => r.y))]
  return (
    <div className="wrap page" style={{ paddingTop: 20 }}>
      <Crumbs items={[['Головна', '/'], ['Архів']]} />
      <h1 className="h1p">Архів</h1>
      {years.length === 0 && <p className="empty">Матеріалів поки немає.</p>}
      {years.map((y) => (
        <section key={y} style={{ marginBottom: 24 }}>
          <h2 style={{ font: '700 24px var(--serif)', margin: '16px 0 8px' }}>{y}</h2>
          <div className="chips">
            {rows.filter((r) => r.y === y).map((r) => (
              <Link key={r.m} className="chip" href={`/arkhiv/${y}/${String(r.m).padStart(2, '0')}`}>{MONTHS[r.m - 1]} · {r.n}</Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
