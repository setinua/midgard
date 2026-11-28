import type { Metadata } from 'next'
import { CopyButton } from '../../../components/CopyButton'
import { Crumbs } from '../../../components/ListPage'
import { ARTICLE_TYPES, SITE_NAME, SITE_URL } from '../../../lib/constants'
import { getTaxonomy } from '../../../lib/data'
import { pageMeta } from '../../../lib/seo'

export const metadata: Metadata = pageMeta({
  title: 'RSS-стрічки',
  description: `Підписка на матеріали «${SITE_NAME}» через RSS: уся стрічка, окремі розділи, регіони й епохи.`,
  path: '/rss',
})

type Feed = { name: string; path: string }

/**
 * Human page for RSS. Phones (iOS Safari) cannot open an .xml feed directly and offer the App Store instead,
 * so the header and footer link here: what RSS is, feed addresses with copy buttons, one-tap Feedly / Inoreader.
 */
function FeedRow({ name, path }: Feed) {
  const url = `${SITE_URL}${path}`
  const enc = encodeURIComponent(url)
  return (
    <li className="rss-row">
      <div className="rss-name">{name}</div>
      <code className="rss-url">{url}</code>
      <div className="rss-actions">
        <CopyButton text={url} />
        <a className="rss-btn" href={`https://feedly.com/i/subscription/feed/${enc}`} target="_blank" rel="noopener noreferrer">Feedly</a>
        <a className="rss-btn" href={`https://www.inoreader.com/?add_feed=${enc}`} target="_blank" rel="noopener noreferrer">Inoreader</a>
      </div>
    </li>
  )
}

function Group({ title, feeds }: { title: string; feeds: Feed[] }) {
  if (!feeds.length) return null
  return (
    <section className="rss-group">
      <h2>{title}</h2>
      <ul>{feeds.map((f) => <FeedRow key={f.path} {...f} />)}</ul>
    </section>
  )
}

export default async function RssPage() {
  const { regions, epochs } = await getTaxonomy()
  const types = ARTICLE_TYPES.filter((t) => t.value !== 'partner')
  return (
    <div className="wrap page" style={{ paddingTop: 20, maxWidth: 820 }}>
      <Crumbs items={[['Головна', '/'], ['RSS']]} />
      <h1 className="h1p">RSS-стрічки</h1>
      <div className="rss-intro">
        <p>
          RSS — спосіб читати нові матеріали «{SITE_NAME}» у програмі-читалці (Feedly, Inoreader, NetNewsWire, Reeder тощо) разом з іншими сайтами,
          без соцмереж і алгоритмів.
        </p>
        <p>
          <strong>Як підписатися:</strong> натисніть «Feedly» чи «Inoreader» біля потрібної стрічки — або скопіюйте адресу й додайте її у свою читалку.
          На iPhone сама адреса в браузері не відкривається — це нормально: її треба вставити в читалку.
        </p>
      </div>
      <Group title="Усі матеріали" feeds={[{ name: 'Усе нове на сайті', path: '/rss.xml' }]} />
      <Group title="Розділи" feeds={types.map((t) => ({ name: t.label, path: `/rss/typ/${t.path}` }))} />
      <Group title="Регіони" feeds={regions.map((r) => ({ name: r.name, path: `/rss/region/${r.slug}` }))} />
      <Group title="Епохи" feeds={epochs.map((e) => ({ name: e.name, path: `/rss/epokha/${e.slug}` }))} />
    </div>
  )
}
