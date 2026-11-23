import Link from 'next/link'
import { NewsList, SectionHead } from '../../components/Blocks'
import { findArticles } from '../../lib/data'

export default async function NotFound() {
  const news = await findArticles({ where: [{ type: { equals: 'news' } }], limit: 5 }).catch(() => ({ docs: [] }))
  return (
    <div className="wrap page ag" style={{ paddingTop: 32 }}>
      <div>
        <h1 className="h1p">Сторінку не знайдено</h1>
        <p className="intro">Можливо, адреса змінилась або матеріал прибрали. Спробуйте пошук або поверніться на <Link href="/" style={{ color: 'var(--blue-600)' }}>головну</Link>.</p>
        <form className="filters" method="get" action="/poshuk" role="search">
          <label style={{ flex: '1 1 320px' }}>Пошук<input type="search" name="q" style={{ width: '100%' }} /></label>
          <button className="btn" type="submit">Знайти</button>
        </form>
      </div>
      <aside><SectionHead title="Останні новини" /><NewsList items={news.docs} /></aside>
    </div>
  )
}
