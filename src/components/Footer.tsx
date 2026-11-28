import Link from 'next/link'

export function Footer({ description, copyright }: { description?: string | null; copyright?: string | null }) {
  return (
    <footer className="foot">
      <div className="wrap foot-cols">
        <div style={{ flex: '1 1 240px' }}>
          <div style={{ font: '700 24px var(--logo-font)', color: '#fff', letterSpacing: '.04em' }}>МІДГАРД</div>
          <p style={{ margin: '8px 0 0', lineHeight: '22px' }}>{description}</p>
        </div>
        <nav aria-label="Розділи">
          <Link href="/novyny">Новини</Link><Link href="/publikatsii">Публікації</Link><Link href="/interviu">Інтерв’ю</Link><Link href="/spetsproiekty">Спецпроєкти</Link>
        </nav>
        <nav aria-label="Про медіа">
          <Link href="/pro-proiekt">Про проєкт</Link><Link href="/komanda">Команда</Link><Link href="/kontakty">Контакти</Link><Link href="/redaktsiina-polityka">Редакційна політика</Link><Link href="/pidtrymaty">Підтримати</Link>
        </nav>
        <nav aria-label="Інше">
          <Link href="/polityka-konfidentsiinosti">Політика конфіденційності</Link><Link href="/reklama">Реклама на сайті</Link><Link href="/rss">RSS</Link>
        </nav>
      </div>
      <div className="wrap foot-copy">© {new Date().getFullYear()} «Мідгард». {copyright}</div>
    </footer>
  )
}
