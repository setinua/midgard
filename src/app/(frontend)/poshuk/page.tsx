import type { Metadata } from 'next'
import { Crumbs, ListPage, type SP } from '../../../components/ListPage'

export const metadata: Metadata = { title: 'Пошук', robots: { index: false, follow: true } }
type Props = { searchParams: Promise<SP> }

export default async function Search({ searchParams }: Props) {
  const sp = await searchParams
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q || '').trim().slice(0, 100)
  // Each word must appear in the title, lead or text; short stems help with Ukrainian word forms.
  const words = q.split(/\s+/).filter((w) => w.length > 1).slice(0, 6).map((w) => (w.length > 5 ? w.slice(0, w.length - 2) : w))
  const form = (
    <form className="filters" method="get" action="/poshuk" role="search">
      <label style={{ flex: '1 1 320px' }}>Що шукаєте?
        <input type="search" name="q" defaultValue={q} placeholder="Напр.: Стоунхендж" style={{ width: '100%' }} />
      </label>
      <button className="btn" type="submit">Знайти</button>
    </form>
  )
  if (!words.length) {
    return (
      <div className="wrap page" style={{ paddingTop: 20 }}>
        <Crumbs items={[['Головна', '/'], ['Пошук']]} />
        <h1 className="h1p">Пошук</h1>
        {form}
      </div>
    )
  }
  return (
    <ListPage
      title={`Пошук: «${q}»`}
      base="/poshuk"
      sp={sp}
      before={form}
      ads={false}
      where={words.map((w) => ({ searchText: { like: w } }))}
      filters={['region', 'epokha', 'typ']}
      crumbs={<Crumbs items={[['Головна', '/'], ['Пошук']]} />}
    />
  )
}
