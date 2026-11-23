import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Crumbs, ListPage, type SP } from '../../../../../components/ListPage'

type Props = { params: Promise<{ year: string; month: string }>; searchParams: Promise<SP> }
const MONTHS = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень']

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year, month } = await params
  return { title: `Архів: ${MONTHS[+month - 1] || ''} ${year}`, robots: { index: false, follow: true } }
}

export default async function ArchiveMonth({ params, searchParams }: Props) {
  const { year, month } = await params
  const y = +year, m = +month
  if (!(y > 1990 && y < 2100 && m >= 1 && m <= 12)) notFound()
  // Month bounds in Kyiv time (UTC+2/+3); a 1-hour edge error in winter is acceptable for an archive.
  const from = new Date(Date.UTC(y, m - 1, 1, -3)).toISOString()
  const to = new Date(Date.UTC(y, m, 1, -3)).toISOString()
  return (
    <ListPage
      title={`${MONTHS[m - 1]} ${y}`}
      base={`/arkhiv/${year}/${month}`}
      sp={await searchParams}
      where={[{ publishedAt: { greater_than_equal: from } }, { publishedAt: { less_than: to } }]}
      filters={['typ']}
      crumbs={<Crumbs items={[['Головна', '/'], ['Архів', '/arkhiv'], [`${MONTHS[m - 1]} ${y}`]]} />}
    />
  )
}
