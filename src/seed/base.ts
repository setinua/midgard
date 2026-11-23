import type { Payload } from 'payload'
import { EPOCHS, REGIONS } from '../lib/constants'

const PAGES = [
  ['Про проєкт', 'pro-proiekt'],
  ['Команда', 'komanda'],
  ['Партнери', 'partnery'],
  ['Підтримати', 'pidtrymaty'],
  ['Контакти', 'kontakty'],
  ['Редакційна політика', 'redaktsiina-polityka'],
  ['Політика конфіденційності', 'polityka-konfidentsiinosti'],
  ['Реклама на сайті', 'reklama'],
] as const

// Creates the fixed taxonomy (6 regions, 12 epochs) and empty service pages once.
export async function seedBase(payload: Payload) {
  const ensure = async (collection: 'regions' | 'epochs', items: readonly (readonly [string, string])[]) => {
    const { totalDocs } = await payload.count({ collection })
    if (totalDocs > 0) return
    for (const [i, [name, slug]] of items.entries()) {
      await payload.create({ collection, data: { name, slug, order: i + 1 } })
    }
    payload.logger.info(`Seeded ${items.length} ${collection}`)
  }
  await ensure('regions', REGIONS)
  await ensure('epochs', EPOCHS)
  const { totalDocs } = await payload.count({ collection: 'pages' })
  if (totalDocs === 0) {
    for (const [title, slug] of PAGES) {
      await payload.create({ collection: 'pages', data: { title, slug, _status: 'published' } })
    }
  }
}
