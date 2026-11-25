'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Emblem } from './Emblem'
import { Icon } from './Icons'

type Item = { name: string; slug: string }
type Social = { network: string; url: string }

const MAIN = [
  ['Новини', '/novyny'],
  ['Публікації', '/publikatsii'],
  ['Інтерв’ю', '/interviu'],
  ['Спецпроєкти', '/spetsproiekty'],
  ['Архів', '/arkhiv'],
] as const
const SVC = [
  ['Про проєкт', '/pro-proiekt'],
  ['Команда', '/komanda'],
  ['Партнери', '/partnery'],
  ['Підтримати', '/pidtrymaty'],
] as const

export function Header({ regions, epochs, social }: { regions: Item[]; epochs: Item[]; social: Social[] }) {
  const path = usePathname() || '/'
  const [open, setOpen] = useState(false)
  const cur = (href: string) => (path === href || path.startsWith(href + '/') ? 'page' : undefined)

  return (
    <header>
      <a className="skip" href="#main">Перейти до змісту</a>
      <div className="mast">
        <Icon.ruins />
        <div className="wrap">
          <div className="mast-top">
            <nav className="svc" aria-label="Службове меню">
              {SVC.map(([t, h]) => <Link key={h} href={h}>{t}</Link>)}
            </nav>
            <div className="socials">
              {social.map((s) => {
                const I = Icon[s.network as keyof typeof Icon] || Icon.link
                return <a key={s.url} href={s.url} aria-label={s.network} rel="noopener" target="_blank"><I /></a>
              })}
              <a href="/rss.xml" aria-label="RSS"><Icon.rss /></a>
            </div>
          </div>
          <div className="brand-row">
            <button className="icon-btn burger" aria-label="Меню" aria-expanded={open} aria-controls="mmenu" onClick={() => setOpen(!open)}><Icon.menu /></button>
            <Link href="/" className="brand" aria-label="Мідгард — на головну">
              <Emblem className="brand-mark" />
              <span className="wordmark">МІДГАРД</span>
            </Link>
            <span className="tagline">Загублений<br />світ людей</span>
            <Link href="/poshuk" className="icon-btn msearch" aria-label="Пошук"><Icon.search /></Link>
          </div>
        </div>
      </div>
      <div id="mmenu" className="mmenu" hidden={!open}>
        <nav aria-label="Меню">
          {MAIN.map(([t, h]) => <Link key={h} href={h} onClick={() => setOpen(false)}>{t}</Link>)}
        </nav>
        <div className="svc-m">{SVC.map(([t, h]) => <Link key={h} href={h} onClick={() => setOpen(false)}>{t}</Link>)}</div>
      </div>
      <nav className="mainnav" aria-label="Головне меню">
        <div className="wrap">
          <div className="navlist">{MAIN.map(([t, h]) => <Link key={h} href={h} aria-current={cur(h)}>{t}</Link>)}</div>
          <Link href="/poshuk" className="icon-btn search-btn" aria-label="Пошук"><Icon.search /></Link>
        </div>
      </nav>
      <div className="rubrics">
        <div className="wrap">
          <div className="rrow">
            <span className="rlabel">Регіони світу</span>
            {regions.map((r) => <Link key={r.slug} href={`/region/${r.slug}`} aria-current={cur(`/region/${r.slug}`)}>{r.name}</Link>)}
          </div>
          <div className="rrow ep">
            <span className="rlabel">Епохи</span>
            {epochs.map((e) => <Link key={e.slug} href={`/epokha/${e.slug}`} aria-current={cur(`/epokha/${e.slug}`)}>{e.name}</Link>)}
          </div>
        </div>
      </div>
    </header>
  )
}
