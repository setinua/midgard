import Link from 'next/link'
import { AdLabel, Empty, NewsList, SectionHead, ThumbList, metaLine } from '../../components/Blocks'
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
      <section className="t1">
        <div>
          <SectionHead title="Останні новини" />
          <NewsList items={h.news} />
          <Link href="/novyny" className="more more-block">Усі новини →</Link>
        </div>
        <article className="c-lead lead-card">
          <SectionHead title="Текст дня" />
          {lead ? (
            <Link href={href(lead)} style={{ display: 'block' }}>
              <Img media={img(lead.hero)} size="lead" className="lead-img" sizes="(max-width: 767px) 100vw, 600px" priority />
              {kicker && <div className="kicker" style={{ margin: '18px 0 8px' }}>{kicker}</div>}
              <h2 className="lc-title">{lead.title}</h2>
              <p className="lc-lead">{lead.lead}</p>
              <div className="meta">{metaLine(lead)}</div>
            </Link>
          ) : (
            <Empty>Редактор ще не обрав «Текст дня».</Empty>
          )}
        </article>
        <div>
          <SectionHead title="Головне сьогодні" />
          {h.main.length ? <ThumbList items={h.main} /> : <Empty>Поки немає матеріалів.</Empty>}
        </div>
      </section>

      <section className="t2" aria-label="Публікації, колонки, спецпроєкти">
        {(
          [
            ['Публікації', '/publikatsii', h.publications, false],
            ['Колонки', '/kolonky', h.columns, true],
            ['Спецпроєкти', '/spetsproiekty', h.specials, false],
          ] as const
        )
          .filter(([, , items]) => items.length)
          .map(([title, url, items, isCol]) => (
            <div key={url}>
              <SectionHead title={title} more={{ href: url, label: 'Усі →' }} />
              <ThumbList items={items} size={96} small={false} withAuthor={isCol} avatar={isCol} />
            </div>
          ))}
      </section>

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
