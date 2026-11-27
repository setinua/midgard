import type React from 'react'
import Link from 'next/link'
import { AdLabel, Empty, NewsList, SectionHead, ThumbList, metaLine } from '../../components/Blocks'
import { Balance } from '../../components/Balance'
import { Img } from '../../components/Img'
import { getHomepage, href, img, rel, type Epoch, type Region } from '../../lib/data'
import { smart } from '../../lib/format'

export default async function Home() {
  const h = await getHomepage()
  const lead = h.textOfDay
  const kicker = lead ? [rel<Epoch>(lead.primaryEpoch)?.name, rel<Region>(lead.primaryRegion)?.name].filter(Boolean).join(' · ') : ''

  return (
    <div className="wrap page stack-48">
      <h1 className="sr-only">Мідгард — археологічне медіа</h1>
      <section className={`t1${lead ? ' balanced' : ''}`}>
        <div className="t1-side">
          <SectionHead title="Останні новини" />
          <div className="fill"><NewsList items={h.news} extraFrom={h.count} /></div>
          <Link href="/novyny" className="more more-block">Усі новини →</Link>
        </div>
        <article className="c-lead lead-card">
          <SectionHead title="Текст дня" />
          {lead ? (
            <Link href={href(lead)} className="lead-link">
              <Img media={img(lead.hero)} size="lead" className="lead-img" sizes="(max-width: 767px) 100vw, 600px" priority />
              {kicker && <div className="kicker lead-kicker">{kicker}</div>}
              <h2 className="lc-title">{lead.title}</h2>
              <p className="lc-lead">{lead.lead}</p>
              <div className="meta">{metaLine(lead)}</div>
            </Link>
          ) : (
            <Empty>Редактор ще не обрав «Текст дня».</Empty>
          )}
          {h.popular.length > 0 && (
            <div className="lead-pop">
              <SectionHead title="Популярні" />
              <ThumbList items={h.popular} size={96} small={false} />
            </div>
          )}
        </article>
        <div className="t1-side">
          <SectionHead title="Головне сьогодні" />
          <div className="fill">{h.main.length ? <ThumbList items={h.main} extraFrom={h.count} /> : <Empty>Поки немає матеріалів.</Empty>}</div>
        </div>
        <Balance />
      </section>

      {(() => {
        // Second tier: up to three sections; empty ones are hidden and the rest share the row.
        const blocks = (
          [
            ['Публікації', '/publikatsii', h.publications],
            ['Інтерв’ю', '/interviu', h.interviews],
            ['Спецпроєкти', '/spetsproiekty', h.specials],
          ] as const
        ).filter(([, , items]) => items.length)
        return blocks.length ? (
          <section className="t2" aria-label="Публікації, інтерв’ю, спецпроєкти" style={{ '--n': blocks.length } as React.CSSProperties}>
            {blocks.map(([title, url, items]) => (
              <div key={url}>
                <SectionHead title={title} more={{ href: url, label: 'Усі →' }} />
                <ThumbList items={items} size={96} small={false} />
              </div>
            ))}
          </section>
        ) : null
      })()}

      {h.partners.length > 0 && (
        <section>
          <SectionHead title="Партнерські матеріали" />
          <div className="pt">
            {h.partners.map((p) => (
              <Link key={p.id} href={href(p)} className="li" style={{ gap: 16 }}>
                <Img media={img(p.hero)} size="thumb" className="th-120" sizes="120px" />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="meta" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{smart(p.publishedAt)} <AdLabel /></span>
                  <span className="h-card">{p.title}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
