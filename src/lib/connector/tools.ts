import type { Payload } from 'payload'
import {
  ALLOWED_TYPES,
  UserError,
  createArticle,
  ownArticle,
  publicUrl,
  setCover,
  summary,
  updateArticle,
} from './articles'
import { downloadImage } from './images'
import { lexicalToMarkdown } from './markdown'
import { signUpload, uploadUrl } from './security'

const str = (description: string, extra: object = {}) => ({ type: 'string', description, ...extra })
const slugList = (description: string) => ({ type: 'array', items: { type: 'string' }, description })
const sources = {
  type: 'array',
  description: 'Джерела: назва і посилання. Для новини — щонайменше одне.',
  items: { type: 'object', properties: { title: str('Назва джерела'), url: str('Посилання http(s)') }, required: ['title'] },
}
const articleFields = {
  title: str('Заголовок (H1), українською'),
  lead: str('Анотація: 1–3 речення під заголовком'),
  content_markdown: str(
    'Текст статті в Markdown: абзаци, ## / ### підзаголовки, списки, > цитати, **жирний**, *курсив*, [посилання](https://…). HTML не підтримується. Рядки {{блок:N}} (фото, вбудування) зберігайте як є, якщо їх не треба прибрати.',
  ),
  type: str('Тип матеріалу', { enum: ALLOWED_TYPES }),
  primary_region: str('Основний регіон (slug із get_site_info)'),
  primary_epoch: str('Основна епоха (slug із get_site_info)'),
  regions: slugList('Додаткові регіони (slug)'),
  epochs: slugList('Додаткові епохи (slug)'),
  tags: slugList('Теги (slug, лише наявні)'),
  sources,
}

export const TOOLS = [
  {
    name: 'get_site_info',
    description: 'Хто підключений, а також регіони, епохи, теги й типи матеріалів сайту «Мідгард» (slug для інших інструментів). Викликати перед першим створенням матеріалу.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'list_my_articles',
    description: 'Матеріали, які створив цей журналіст: чернетки й опубліковані, новіші першими.',
    inputSchema: {
      type: 'object',
      properties: { query: str('Слова з заголовка (необов’язково)'), status: str('Фільтр статусу', { enum: ['draft', 'published'] }), limit: { type: 'number', description: 'До 50, типово 20' } },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'get_article',
    description: 'Повна остання версія власного матеріалу (текст у Markdown) — щоб правити.',
    inputSchema: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'search_site',
    description: 'Пошук серед опублікованих матеріалів сайту (щоб перевірити, чи про тему вже писали).',
    inputSchema: { type: 'object', properties: { query: str('Слова для пошуку') }, required: ['query'] },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'create_article',
    description:
      'Створює матеріал на «Мідгарді» як ЧЕРНЕТКУ (публікує редактор). Перед викликом покажіть журналісту текст і отримайте згоду. Не вигадуйте фактів, цитат і джерел.',
    inputSchema: { type: 'object', properties: articleFields, required: ['title', 'lead', 'content_markdown', 'primary_region', 'primary_epoch'] },
  },
  {
    name: 'update_article',
    description:
      'Змінює власний матеріал. Передавайте лише поля, які змінюються; content_markdown замінює весь текст. Чернетка лишається чернеткою; в опублікованому матеріалі зміни одразу з’являються на сайті — спершу покажіть журналісту, що зміниться.',
    inputSchema: { type: 'object', properties: { id: { type: 'number' }, ...articleFields }, required: ['id'] },
    annotations: { destructiveHint: true },
  },
  {
    name: 'set_cover_from_url',
    description: 'Ставить обкладинкою власного матеріалу фото за прямим https-посиланням на файл JPG/PNG/WEBP (до 20 МБ). Потрібні опис і автор фото.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'number' }, url: str('Пряме посилання на файл фото'), alt: str('Що зображено'), credit: str('Автор / джерело фото'), caption: str('Підпис (необов’язково)'), license: str('Ліцензія / дозвіл (необов’язково)') },
      required: ['id', 'url', 'alt', 'credit'],
    },
  },
  {
    name: 'get_photo_upload_link',
    description: 'Посилання на сторінку, де журналіст сам завантажує фото з телефону чи комп’ютера як обкладинку власного матеріалу. Діє 24 години, лише для цього матеріалу.',
    inputSchema: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] },
  },
]

const text = (v: unknown) => ({ content: [{ type: 'text', text: typeof v === 'string' ? v : JSON.stringify(v, null, 2) }] })

export async function callTool(payload: Payload, user: any, name: string, args: any) {
  args = args && typeof args === 'object' ? args : {}
  try {
    switch (name) {
      case 'get_site_info': {
        const [regions, epochs, tags] = await Promise.all(
          (['regions', 'epochs', 'tags'] as const).map((c) => payload.find({ collection: c, limit: 300, depth: 0, sort: 'order' })),
        )
        const pick = (r: any) => r.docs.map((d: any) => ({ slug: d.slug, name: d.name }))
        return text({
          you: { name: user.name || user.email, role: user.role, signedAs: user.author ? 'профіль автора прив’язано' : 'профіль автора НЕ прив’язано — підпис «Редакція»' },
          rules: 'Нові матеріали — лише чернетки; публікує редактор. Можна правити тільки власні матеріали. Для новин потрібні джерела.',
          types: ALLOWED_TYPES,
          regions: pick(regions),
          epochs: pick(epochs),
          tags: pick(tags),
        })
      }
      case 'list_my_articles': {
        const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 50)
        const and: any[] = [{ createdBy: { equals: user.id } }]
        if (args.query) and.push({ title: { like: String(args.query).slice(0, 200) } })
        if (args.status === 'draft' || args.status === 'published') and.push({ _status: { equals: args.status } })
        const res = await payload.find({ collection: 'articles', where: { and }, draft: true, sort: '-updatedAt', limit, depth: 0, user, overrideAccess: false })
        return text({ total: res.totalDocs, items: res.docs.map((d: any) => summary(d)) })
      }
      case 'get_article': {
        const doc = await ownArticle(payload, user, Number(args.id))
        const { markdown } = lexicalToMarkdown(doc.content)
        const [regions, epochs, tags] = await Promise.all([
          slugs(payload, 'regions', [doc.primaryRegion, ...(doc.regions || [])]),
          slugs(payload, 'epochs', [doc.primaryEpoch, ...(doc.epochs || [])]),
          slugs(payload, 'tags', doc.tags || []),
        ])
        return text({
          ...summary(doc),
          lead: doc.lead,
          primary_region: regions[0],
          regions: regions.slice(1),
          primary_epoch: epochs[0],
          epochs: epochs.slice(1),
          tags,
          sources: (doc.sources || []).map((s: any) => ({ title: s.title, url: s.url })),
          hasCover: Boolean(doc.hero),
          content_markdown: markdown,
        })
      }
      case 'search_site': {
        const q = String(args.query || '').trim().slice(0, 200)
        if (!q) throw new UserError('Порожній запит')
        const res = await payload.find({
          collection: 'articles',
          where: { and: [{ _status: { equals: 'published' } }, { or: [{ title: { like: q } }, { searchText: { like: q } }] }] },
          sort: '-publishedAt',
          limit: 10,
          depth: 0,
          overrideAccess: true,
          select: { title: true, slug: true, type: true, publishedAt: true },
        })
        return text(res.docs.map((d: any) => ({ id: d.id, title: d.title, publishedAt: d.publishedAt, url: publicUrl(d) })))
      }
      case 'create_article': {
        const doc = await createArticle(payload, user, args)
        log(payload, user, 'create', doc.id)
        return text({ ok: true, message: 'Чернетку створено. Її опублікує редактор.', ...summary(doc, false), next: 'Обкладинка: set_cover_from_url або get_photo_upload_link' })
      }
      case 'update_article': {
        const { id, ...rest } = args
        const { doc, live } = await updateArticle(payload, user, Number(id), rest)
        log(payload, user, live ? 'update-live' : 'update-draft', doc.id)
        return text({ ok: true, message: live ? 'Зміни збережено й уже на сайті.' : 'Чернетку оновлено.', ...summary(doc, live) })
      }
      case 'set_cover_from_url': {
        const buf = await downloadImage(String(args.url || ''))
        const { media, width, live } = await setCover(payload, user, Number(args.id), buf, args)
        log(payload, user, 'cover-url', Number(args.id))
        return text({ ok: true, message: 'Обкладинку встановлено.', mediaId: media.id, warning: width < 1200 ? `Фото завширшки ${width} px — менше рекомендованих 1200 px` : undefined, live })
      }
      case 'get_photo_upload_link': {
        const doc = await ownArticle(payload, user, Number(args.id))
        log(payload, user, 'upload-link', doc.id)
        return text({ url: uploadUrl(signUpload(doc.id, user.id, user.connectorTokenHash)), validHours: 24, article: doc.title, note: 'Відкрийте посилання, виберіть фото, вкажіть автора — воно стане обкладинкою. Нікому не пересилайте.' })
      }
      default:
        return { ...text(`Невідомий інструмент: ${name}`), isError: true }
    }
  } catch (e: any) {
    if (e instanceof UserError) return { ...text(e.message), isError: true }
    const msg = String(e?.message || '')
    // Payload validation / access messages are safe and useful; anything else stays in the server log.
    if (e?.status && e.status < 500 && msg) return { ...text(`Сайт відхилив дію: ${msg}`), isError: true }
    if (/^(Фото|Адреса фото|Сайт із фото|Потрібне посилання|Посилання з|Неправильне посилання|Забагато|Не вдалося|Це не фото|Підходять)/.test(msg))
      return { ...text(msg), isError: true }
    payload.logger.error({ err: e, connectorUser: user.email, tool: name }, 'connector tool failed')
    return { ...text('Внутрішня помилка сайту. Спробуйте ще раз або напишіть адміністратору.'), isError: true }
  }
}

async function slugs(payload: Payload, collection: 'regions' | 'epochs' | 'tags', vals: any[]) {
  const ids = vals.map((v) => (v && typeof v === 'object' ? v.id : v)).filter(Boolean)
  if (!ids.length) return []
  const res = await payload.find({ collection, where: { id: { in: ids } }, limit: 100, depth: 0 })
  const m = new Map(res.docs.map((d: any) => [d.id, d.slug]))
  return ids.map((i) => m.get(i)).filter(Boolean)
}

function log(payload: Payload, user: any, action: string, id: number) {
  payload.logger.info({ connectorUser: user.email, action, article: id }, 'connector')
}
