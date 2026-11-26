import Link from 'next/link'
import type { ReactNode } from 'react'
import { authorNames, href, img, rel, type Author, type Card } from '../lib/data'
import { smart, time } from '../lib/format'
import { Img } from './Img'

export function SectionHead({ title, more, level = 2 }: { title: string; more?: { href: string; label: string }; level?: 2 | 3 }) {
  const H = level === 2 ? 'h2' : 'h3'
  return (
    <div className="sh">
      <H className="tab">{title}</H>
      {more && <Link href={more.href} className="more">{more.label}</Link>}
    </div>
  )
}

export function NewsList({ items, extraFrom }: { items: Card[]; extraFrom?: number }) {
  if (!items.length) return <p className="empty">Поки немає новин.</p>
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((n, i) => (
        <li key={n.id} className={extraFrom !== undefined && i >= extraFrom ? 'x-extra' : undefined}>
          <Link href={href(n)} className="li">
            <time className="time" dateTime={n.publishedAt}>{time(n.publishedAt)}</time>
            <span className="h-card">{n.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function ThumbList({ items, size = 72, small = true, withAuthor = false, avatar = false, extraFrom }: { items: Card[]; size?: 72 | 96 | 120; small?: boolean; withAuthor?: boolean; avatar?: boolean; extraFrom?: number }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((a, i) => {
        const author = rel<Author>(a.authors?.[0])
        const pic = avatar ? img(author?.photo) || img(a.hero) : img(a.hero)
        return (
          <li key={a.id} className={extraFrom !== undefined && i >= extraFrom ? 'x-extra' : undefined}>
            <Link href={href(a)} className="li li-thumb" style={{ alignItems: avatar ? 'center' : 'flex-start' }}>
              <Img media={pic} size="thumb" className={avatar ? 'av-48' : `th-${size}`} sizes={`${size}px`} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className={small ? 'h-sm' : 'h-card'}>{a.title}</span>
                {withAuthor && <span className="byline">{authorNames(a)}</span>}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>
}

export function AdLabel() {
  return <span className="ad">Реклама</span>
}

export const metaLine = (a: Card) => `${authorNames(a)} · ${smart(a.publishedAt)}`
