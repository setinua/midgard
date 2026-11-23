// @ts-nocheck — one-off script for test content
// Test content for the closed test site ONLY. Every item is tagged «тест» so it can be removed before launch:
//   npx payload run src/seed/demo.ts           — create
//   npx payload run src/seed/demo.ts --remove  — delete all test items
// On the server: set SEED_DEMO=1 (create, once) or SEED_DEMO=remove in Railway variables and redeploy.
import sharp from 'sharp'

export async function demoSeed(payload, remove = false) {
const existing = (await payload.find({ collection: 'tags', where: { slug: { equals: 'test' } }, limit: 1 })).docs[0]
if (!remove && existing) {
  const count = await payload.count({ collection: 'articles', where: { tags: { in: [existing.id] } } })
  if (count.totalDocs > 0) { payload.logger.info('Demo content already exists, skipping'); return }
}
if (remove && !existing) return
const tag =
  (await payload.find({ collection: 'tags', where: { slug: { equals: 'test' } }, limit: 1 })).docs[0] ||
  (await payload.create({ collection: 'tags', data: { name: 'тест', slug: 'test' } }))

if (remove) {
  const arts = await payload.find({ collection: 'articles', where: { tags: { in: [tag.id] } }, limit: 1000, depth: 0 })
  for (const a of arts.docs) await payload.delete({ collection: 'articles', id: a.id })
  const media = await payload.find({ collection: 'media', where: { license: { equals: 'тестове зображення' } }, limit: 1000 })
  for (const m of media.docs) await payload.delete({ collection: 'media', id: m.id })
  const authors = await payload.find({ collection: 'authors', where: { bio: { like: '[тестовий автор]' } }, limit: 100 })
  for (const a of authors.docs) await payload.delete({ collection: 'authors', id: a.id })
  await payload.delete({ collection: 'tags', id: tag.id })
  payload.logger.info('Test content removed')
  return
}

const tones = ['#cbbba0', '#b7a486', '#a9b4bf', '#c9b48f', '#9fae9a', '#bfa48a']
const mediaIds: number[] = []
for (let i = 0; i < 6; i++) {
  const buf = await sharp({ create: { width: 1600, height: 1000, channels: 3, background: tones[i] } }).jpeg().toBuffer()
  const m = await payload.create({
    collection: 'media',
    data: { alt: 'Тестове зображення', credit: 'Тест', license: 'тестове зображення' },
    file: { data: buf, mimetype: 'image/jpeg', name: `test-${i}.jpg`, size: buf.length },
  })
  mediaIds.push(m.id as number)
}

const authorIds: number[] = []
for (const name of ['Автор Перший', 'Авторка Друга', 'Автор Третій']) {
  const a = await payload.create({ collection: 'authors', data: { name, expertise: 'археолог', bio: '[тестовий автор] Коротка біографія автора.', photo: mediaIds[authorIds.length + 2] } })
  authorIds.push(a.id as number)
}

const regions = (await payload.find({ collection: 'regions', sort: 'order', limit: 10 })).docs
const epochs = (await payload.find({ collection: 'epochs', sort: 'order', limit: 20 })).docs
const para = (t: string) => ({ type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children: [{ type: 'text', version: 1, text: t, format: 0, style: '', mode: 'normal', detail: 0 }] })
const h2 = (t: string) => ({ type: 'heading', tag: 'h2', version: 1, direction: 'ltr', format: '', indent: 0, children: [{ type: 'text', version: 1, text: t, format: 0, style: '', mode: 'normal', detail: 0 }] })
const content = {
  root: {
    type: 'root', version: 1, direction: 'ltr', format: '', indent: 0,
    children: [
      para('Це тестовий текст для перевірки верстки. Справжні матеріали додає редакція через адмінку.'),
      h2('Підзаголовок другого рівня'),
      para('Абзац тексту з довжиною рядка близько 68 знаків, щоб перевірити, як читається основна колонка на десктопі й телефоні.'),
    ],
  },
}

const plan: [string, number][] = [['news', 14], ['publication', 6], ['column', 6], ['interview', 2], ['special', 6], ['partner', 6]]
let n = 0
const ids: Record<string, number[]> = {}
for (const [type, count] of plan) {
  for (let i = 0; i < count; i++) {
    n++
    const a = await payload.create({
      collection: 'articles',
      draft: false,
      data: {
        _status: 'published',
        type: type as any,
        title: `Тестовий матеріал №${n}: перевірка довжини заголовка в стрічці`,
        lead: 'Тестова анотація: одне-два речення про те, що читач знайде в матеріалі.',
        hero: mediaIds[n % 6],
        content: content as any,
        primaryRegion: regions[n % regions.length].id,
        primaryEpoch: epochs[n % epochs.length].id,
        tags: [tag.id],
        authors: type === 'news' ? [] : [authorIds[n % 3]],
        sources: type === 'news' ? [{ title: 'Тестове джерело', url: 'https://example.com' }] : [],
        sponsor: type === 'partner' ? 'Тестовий партнер' : undefined,
        interviewee: type === 'interview' ? { name: 'Співрозмовник Тестовий', title: 'доктор історичних наук' } : undefined,
        publishedAt: new Date(Date.now() - n * 47 * 60 * 1000).toISOString(),
      },
    })
    ;(ids[type] ||= []).push(a.id as number)
  }
}

await payload.updateGlobal({
  slug: 'homepage',
  data: { textOfDay: ids.publication[0], mainToday: [...ids.publication.slice(1), ...ids.special, ...ids.column.slice(0, 2)].slice(0, 10), popular: [...ids.publication.slice(2, 4), ...ids.special.slice(0, 3)] },
})
payload.logger.info(`Created ${n} test articles`)
}
