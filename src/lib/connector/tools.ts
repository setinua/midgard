import type { Payload } from 'payload'
import {
  ALLOWED_TYPES,
  UserError,
  createArticle,
  findDuplicates,
  findOwn,
  liveGuard,
  ownArticle,
  setCover,
  summary,
  updateArticle,
} from './articles'
import { downloadImage } from './images'
import { lexicalToMarkdown } from './markdown'
import { signUpload, uploadUrl } from './security'

// Tool descriptions stay under 300 characters and results under ~1 KB (except get_article's text):
// both are re-read by Claude on every step.

const s = (description: string, extra: object = {}) => ({ type: 'string', description, ...extra })
const slugs = (description: string) => ({ type: 'array', items: { type: 'string' }, description })
const id = { type: 'number', description: 'id матеріалу' }
const confirm = { type: 'boolean', description: 'true — свідомо змінити вже опублікований матеріал' }
const fields = {
  title: s('Заголовок, ≤300'),
  lead: s('Анотація, 1–2 речення, ≤1000'),
  content_markdown: s('Текст у Markdown: абзаци, ##, списки, >, **ж**, *к*, [т](https://…). Без HTML. Рядки {{блок:N}} не чіпати'),
  type: s('Тип, типово news', { enum: ALLOWED_TYPES }),
  primary_region: s('slug регіону'),
  primary_epoch: s('slug епохи'),
  regions: slugs('Додаткові регіони, slug'),
  epochs: slugs('Додаткові епохи, slug'),
  tags: slugs('Теги, slug'),
  sources: {
    type: 'array',
    description: 'Джерела ≤30; перше посилання — ключ від дублів',
    items: { type: 'object', properties: { title: s('Назва'), url: s('https://…') }, required: ['title'] },
  },
}

export const TOOLS = [
  {
    name: 'get_dictionaries',
    description: 'Slug і назви регіонів, епох або тегів сайту «Мідгард». Викликати раз на новину; значень за замовчуванням немає.',
    inputSchema: { type: 'object', properties: { type: s('Довідник', { enum: ['regions', 'epochs', 'tags'] }) }, required: ['type'] },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'find_duplicates',
    description: 'Шукає дублі серед чернеток і опублікованих: точний збіг посилання джерела і схожі заголовки. Повертає id, заголовок, дату, статус, схожість 0–1, причину.',
    inputSchema: { type: 'object', properties: { source_url: s('Посилання на оригінал'), title: s('Заголовок'), limit: { type: 'number', description: 'Типово 5' } } },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'list_my_articles',
    description: 'Власні матеріали журналіста (чернетки й опубліковані), новіші першими.',
    inputSchema: { type: 'object', properties: { status: s('Фільтр', { enum: ['draft', 'published'] }), limit: { type: 'number', description: '≤20, типово 10' } } },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'get_article',
    description: 'Власний матеріал за id або source_url: поля і текст у Markdown — щоб перевірити результат.',
    inputSchema: { type: 'object', properties: { id, source_url: s('Посилання джерела') } },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'create_article',
    description: 'Створює чернетку (статус завжди draft; публікує редактор). Повтор з тим самим першим джерелом → duplicate_source і id наявного. Перед викликом покажіть текст журналісту.',
    inputSchema: { type: 'object', properties: fields, required: ['title', 'lead', 'content_markdown', 'primary_region', 'primary_epoch', 'sources'] },
  },
  {
    name: 'update_article',
    description: 'Часткова зміна власного матеріалу: лише змінені поля, текст не повторювати. Статус не змінюється. Опублікований — лише з confirm_published=true, інакше not_draft.',
    inputSchema: { type: 'object', properties: { id, ...fields, confirm_published: confirm }, required: ['id'] },
    annotations: { destructiveHint: true },
  },
  {
    name: 'set_cover_from_url',
    description: 'Обкладинка власного матеріалу з прямого https-посилання на файл JPG/PNG/WEBP ≤20 МБ (рекомендовано 1600×900). Опублікований — з confirm_published=true.',
    inputSchema: {
      type: 'object',
      properties: { id, url: s('Пряме посилання на файл'), alt: s('Що на фото'), credit: s('Автор / джерело фото'), confirm_published: confirm },
      required: ['id', 'url', 'alt', 'credit'],
    },
  },
  {
    name: 'get_photo_upload_link',
    description: 'Адреса на 24 год для обкладинки власного матеріалу: людина відкриває в браузері, або з робочого простору curl -F file=@x.jpg -F alt=… -F credit=… <адреса>. Без base64. Опублікований — з confirm_published=true.',
    inputSchema: { type: 'object', properties: { id, confirm_published: confirm }, required: ['id'] },
  },
]

const ok = (v: unknown) => ({ content: [{ type: 'text', text: JSON.stringify(v) }] })
const fail = (error: string, hint: string, details?: Record<string, unknown>) => ({
  content: [{ type: 'text', text: JSON.stringify({ error, hint, ...details }) }],
  isError: true,
})

// Dictionaries change rarely: cache for 5 minutes.
const dictCache = new Map<string, { at: number; items: any[] }>()
async function dictionary(payload: Payload, type: 'regions' | 'epochs' | 'tags') {
  const hit = dictCache.get(type)
  if (hit && Date.now() - hit.at < 5 * 60 * 1000) return hit.items
  const res = await payload.find({ collection: type, limit: 500, depth: 0, sort: type === 'tags' ? 'name' : 'order', select: { slug: true, name: true } })
  const items = res.docs.map((d: any) => [d.slug, d.name])
  dictCache.set(type, { at: Date.now(), items })
  return items
}

const IMAGE_ERR = /^(Фото|Адреса фото|Сайт із фото|Потрібне посилання|Посилання з|Неправильне посилання|Забагато|Не вдалося|Це не фото|Підходять)/

export async function callTool(payload: Payload, user: any, name: string, args: any) {
  args = args && typeof args === 'object' ? args : {}
  try {
    switch (name) {
      case 'get_dictionaries': {
        if (!['regions', 'epochs', 'tags'].includes(args.type)) throw new UserError('invalid_field', 'type: regions, epochs або tags', { field: 'type' })
        return ok({ type: args.type, items: await dictionary(payload, args.type), format: '[slug, назва]' })
      }
      case 'find_duplicates':
        return ok({ matches: await findDuplicates(payload, args) })
      case 'list_my_articles': {
        const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 20)
        const and: any[] = [{ createdBy: { equals: user.id } }]
        if (args.status === 'draft' || args.status === 'published') and.push({ _status: { equals: args.status } })
        const res = await payload.find({
          collection: 'articles',
          where: { and },
          draft: true,
          sort: '-updatedAt',
          limit,
          depth: 0,
          user,
          overrideAccess: false,
          select: { title: true, _status: true, updatedAt: true },
        })
        return ok({ total: res.totalDocs, items: res.docs.map((d: any) => [d.id, d._status, String(d.updatedAt).slice(0, 10), String(d.title).slice(0, 90)]), format: '[id, статус, дата, заголовок]' })
      }
      case 'get_article': {
        const doc = await findOwn(payload, user, args)
        const [reg, ep, tg] = await Promise.all([
          slugsOf(payload, 'regions', [doc.primaryRegion, ...(doc.regions || [])]),
          slugsOf(payload, 'epochs', [doc.primaryEpoch, ...(doc.epochs || [])]),
          slugsOf(payload, 'tags', doc.tags || []),
        ])
        return ok({
          ...summary(doc),
          type: doc.type,
          title: doc.title,
          lead: doc.lead,
          primary_region: reg[0],
          regions: reg.slice(1),
          primary_epoch: ep[0],
          epochs: ep.slice(1),
          tags: tg,
          sources: (doc.sources || []).map((x: any) => ({ title: x.title, url: x.url })),
          has_cover: Boolean(doc.hero),
          content_markdown: lexicalToMarkdown(doc.content).markdown,
        })
      }
      case 'create_article': {
        const doc = await createArticle(payload, user, args)
        log(payload, user, 'create', doc.id)
        return ok(summary(doc, false))
      }
      case 'update_article': {
        const { id: aid, ...rest } = args
        const { doc, live } = await updateArticle(payload, user, Number(aid), rest)
        log(payload, user, live ? 'update-live' : 'update-draft', doc.id)
        return ok(summary(doc, live))
      }
      case 'set_cover_from_url': {
        const aid = Number(args.id)
        await ownArticle(payload, user, aid)
        await liveGuard(payload, aid, args.confirm_published)
        const buf = await downloadImage(String(args.url || ''))
        const { media, width, height, live } = await setCover(payload, user, aid, buf, args)
        log(payload, user, 'cover-url', aid)
        return ok({ id: aid, media_id: media.id, size: `${width}×${height}`, live, warning: width < 1200 ? 'ширина менша за 1200 px' : undefined })
      }
      case 'get_photo_upload_link': {
        const doc = await ownArticle(payload, user, Number(args.id))
        await liveGuard(payload, doc.id, args.confirm_published)
        log(payload, user, 'upload-link', doc.id)
        return ok({ url: uploadUrl(signUpload(doc.id, user.id, user.connectorTokenHash)), valid_hours: 24, curl: 'curl -F file=@card.jpg -F alt=… -F credit=… <url>' })
      }
      default:
        return fail('unknown_tool', `Невідомий інструмент: ${name}`)
    }
  } catch (e: any) {
    if (e instanceof UserError) return fail(e.code, e.message, e.details)
    const msg = String(e?.message || '')
    if (IMAGE_ERR.test(msg)) return fail('image_error', msg)
    // Payload validation / access messages are safe and useful; anything else stays in the server log.
    if (e?.status && e.status < 500 && msg) return fail(e.status === 403 ? 'forbidden' : 'rejected', msg.slice(0, 300))
    payload.logger.error({ err: e, connectorUser: user.email, tool: name }, 'connector tool failed')
    return fail('internal', 'Внутрішня помилка сайту. Спробуйте ще раз або напишіть адміністратору')
  }
}

async function slugsOf(payload: Payload, collection: 'regions' | 'epochs' | 'tags', vals: any[]) {
  const ids = vals.map((v) => (v && typeof v === 'object' ? v.id : v)).filter(Boolean)
  if (!ids.length) return []
  const res = await payload.find({ collection, where: { id: { in: ids } }, limit: 100, depth: 0 })
  const m = new Map(res.docs.map((d: any) => [d.id, d.slug]))
  return ids.map((i) => m.get(i)).filter(Boolean)
}

/** Action log: who, what, which id (Railway logs). */
function log(payload: Payload, user: any, action: string, aid: number) {
  payload.logger.info({ connectorUser: user.email, action, article: aid }, 'connector')
}
