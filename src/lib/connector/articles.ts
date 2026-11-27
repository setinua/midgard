import sharp from 'sharp'
import type { Payload } from 'payload'
import { ARTICLE_TYPES, typeByValue } from '../constants'
import { slugify } from '../slug'
import { inspectImage } from './images'
import { isSafeUrl, lexicalToMarkdown, markdownToLexical } from './markdown'

// Everything the connector does goes through Payload with the journalist's own account
// (overrideAccess: false), plus one extra rule: only articles this account created.

export const SITE = () => (process.env.SERVER_URL || '').replace(/\/$/, '')
export const ALLOWED_TYPES = ARTICLE_TYPES.filter((t) => t.value !== 'partner').map((t) => t.value)

/** An error the journalist/Claude can act on: machine code + hint (+ optional details). */
export class UserError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message)
  }
}

const idOf = (v: any) => (v && typeof v === 'object' ? v.id : v)

export const publicUrl = (doc: any) => {
  const t = typeByValue(String(doc?.type || ''))
  return t && doc?.slug ? `${SITE()}/${t.path}/${doc.slug}` : null
}
export const adminUrl = (id: number | string) => `${SITE()}/admin/collections/articles/${id}`

/** Same link written differently (case, www, trailing slash, utm, #) → same key. */
export function normalizeUrl(raw: unknown): string | null {
  try {
    const u = new URL(String(raw || '').trim())
    if (!/^https?:$/.test(u.protocol)) return null
    u.hash = ''
    for (const k of [...u.searchParams.keys()]) if (/^(utm_|fbclid|gclid)/i.test(k)) u.searchParams.delete(k)
    const host = u.hostname.toLowerCase().replace(/^www\./, '')
    const path = u.pathname.replace(/\/+$/, '')
    return `${host}${path}${u.search}`
  } catch {
    return null
  }
}

/** Latest version (draft or published) of an article this user created; throws otherwise. */
export async function ownArticle(payload: Payload, user: any, id: number) {
  if (!Number.isInteger(id) || id <= 0) throw new UserError('invalid_id', 'Неправильний id матеріалу')
  let doc: any
  try {
    doc = await payload.findByID({ collection: 'articles', id, draft: true, depth: 0, user, overrideAccess: false })
  } catch {
    doc = null
  }
  if (!doc || idOf(doc.createdBy) !== user.id) throw new UserError('not_found', 'Матеріал не знайдено серед ваших')
  return doc
}

export async function isPublished(payload: Payload, id: number) {
  const live = await payload.find({ collection: 'articles', where: { and: [{ id: { equals: id } }, { _status: { equals: 'published' } }] }, limit: 1, depth: 0, overrideAccess: true })
  return live.totalDocs > 0
}

/** Published articles change on the site at once — only with an explicit confirm_published=true. */
export async function liveGuard(payload: Payload, id: number, confirm: unknown) {
  const live = await isPublished(payload, id)
  if (live && confirm !== true)
    throw new UserError('not_draft', 'Матеріал опубліковано: зміни одразу з’являться на сайті. Покажіть їх журналісту і повторіть з confirm_published=true')
  return live
}

// Every article (drafts included, latest version) with a normalized source link → id.
async function articlesBySource(payload: Payload, key: string) {
  const host = key.split('/')[0]
  const res = await payload.find({
    collection: 'articles',
    where: { 'sources.url': { like: host } },
    draft: true,
    limit: 200,
    depth: 0,
    overrideAccess: true,
    select: { title: true, sources: true, _status: true, updatedAt: true, publishedAt: true, createdBy: true },
  })
  return res.docs.filter((d: any) => (d.sources || []).some((s: any) => normalizeUrl(s.url) === key))
}

const DICT = { regions: 'регіони', epochs: 'епохи', tags: 'теги' } as const
async function idsBySlug(payload: Payload, collection: keyof typeof DICT, slugs: string[]) {
  if (!slugs.length) return []
  const res = await payload.find({ collection, where: { slug: { in: slugs } }, limit: 100, depth: 0 })
  const found = new Map(res.docs.map((d: any) => [d.slug, d.id]))
  const missing = slugs.filter((s) => !found.has(s))
  if (missing.length) throw new UserError('unknown_slug', `Невідомі ${DICT[collection]}: ${missing.join(', ')}. Список: get_dictionaries type=${collection}`, { field: collection, missing })
  return slugs.map((s) => found.get(s))
}

const clip = (v: unknown, max: number, field: string) => {
  const s = String(v ?? '').trim()
  if (s.length > max) throw new UserError('too_long', `${field}: довше за ${max} знаків (${s.length})`, { field, max })
  return s
}

const HTML_RE = /<\/?[a-z][a-z0-9-]*(\s[^<>]*)?\/?>|<!--|&lt;\s*script/i
const noHtml = (s: string, field: string) => {
  if (HTML_RE.test(s)) throw new UserError('html_not_allowed', `${field}: HTML не приймається, лише Markdown`, { field })
  return s
}

/** Validates connector input and turns it into Payload article data. */
async function toData(payload: Payload, input: any, current?: any) {
  const data: any = {}
  if (input.title !== undefined) {
    data.title = noHtml(clip(input.title, 300, 'title'), 'title')
    if (!data.title) throw new UserError('missing_field', 'title порожній', { field: 'title' })
  }
  if (input.lead !== undefined) data.lead = noHtml(clip(input.lead, 1000, 'lead'), 'lead')
  if (input.type !== undefined) {
    if (!ALLOWED_TYPES.includes(input.type)) throw new UserError('invalid_field', `type: один із ${ALLOWED_TYPES.join(', ')}`, { field: 'type' })
    data.type = input.type
  }
  if (input.content_markdown !== undefined) {
    const md = noHtml(clip(input.content_markdown, 100000, 'content_markdown'), 'content_markdown')
    for (const m of md.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g))
      if (!isSafeUrl(m[1])) throw new UserError('invalid_field', `content_markdown: посилання лише http(s): ${m[1].slice(0, 80)}`, { field: 'content_markdown' })
    const keep = current ? lexicalToMarkdown(current.content).keep : []
    data.content = markdownToLexical(md, keep)
  }
  if (input.sources !== undefined) {
    if (!Array.isArray(input.sources) || input.sources.length > 30) throw new UserError('invalid_field', 'sources: список до 30 пунктів', { field: 'sources' })
    data.sources = input.sources.map((s: any) => {
      const title = noHtml(clip(s?.title, 300, 'sources.title'), 'sources.title')
      const url = s?.url ? clip(s.url, 2000, 'sources.url') : ''
      if (!title) throw new UserError('missing_field', 'У кожного джерела має бути назва', { field: 'sources.title' })
      if (url && !isSafeUrl(url)) throw new UserError('invalid_field', `sources.url: лише http(s): ${url.slice(0, 80)}`, { field: 'sources.url' })
      return { title, url: url || undefined }
    })
  }
  if (input.primary_region !== undefined) data.primaryRegion = (await idsBySlug(payload, 'regions', [String(input.primary_region)]))[0]
  if (input.primary_epoch !== undefined) data.primaryEpoch = (await idsBySlug(payload, 'epochs', [String(input.primary_epoch)]))[0]
  if (input.regions !== undefined) data.regions = await idsBySlug(payload, 'regions', (input.regions || []).map(String).slice(0, 10))
  if (input.epochs !== undefined) data.epochs = await idsBySlug(payload, 'epochs', (input.epochs || []).map(String).slice(0, 10))
  if (input.tags !== undefined) data.tags = await idsBySlug(payload, 'tags', (input.tags || []).map(String).slice(0, 20))
  return data
}

async function freeSlug(payload: Payload, base: string) {
  for (let i = 1; i < 20; i++) {
    const s = i === 1 ? base : `${base}-${i}`
    const taken = await payload.count({ collection: 'articles', where: { slug: { equals: s } }, overrideAccess: true })
    if (!taken.totalDocs) return s
  }
  return `${base}-${Date.now().toString(36)}`
}

const REQUIRED: [string, string][] = [
  ['title', 'title'],
  ['lead', 'lead'],
  ['content', 'content_markdown'],
  ['primaryRegion', 'primary_region'],
  ['primaryEpoch', 'primary_epoch'],
]

export async function createArticle(payload: Payload, user: any, input: any) {
  for (const [, f] of REQUIRED)
    if (input[f] === undefined || input[f] === null || String(input[f]).trim() === '')
      throw new UserError('missing_field', `Не вистачає ${f}${f.startsWith('primary') ? ' (значення за замовчуванням немає, список: get_dictionaries)' : ''}`, { field: f })
  const data = await toData(payload, { type: 'news', ...input })
  if (data.type === 'news' && !data.sources?.some((s: any) => s.url))
    throw new UserError('missing_field', 'Для новини потрібне джерело з посиланням', { field: 'sources' })
  // Idempotency: the first source link identifies the story.
  const key = normalizeUrl(data.sources?.find((s: any) => s.url)?.url)
  if (key) {
    const dup = (await articlesBySource(payload, key))[0]
    if (dup) throw new UserError('duplicate_source', 'Матеріал із цим джерелом уже є', { id: dup.id, status: dup._status, edit_url: adminUrl(dup.id) })
  }
  data.slug = await freeSlug(payload, slugify(data.title))
  data._status = 'draft'
  return (await payload.create({ collection: 'articles', data, draft: true, user, overrideAccess: false })) as any
}

/** Saves changes. A draft stays a draft; a published article needs confirm_published and stays published. */
export async function updateArticle(payload: Payload, user: any, id: number, input: any) {
  const { confirm_published, ...fields } = input
  const current = await ownArticle(payload, user, id)
  const data = await toData(payload, fields, current)
  if (!Object.keys(data).length) throw new UserError('nothing_to_change', 'Немає полів для зміни')
  const live = await liveGuard(payload, id, confirm_published)
  const doc: any = await payload.update({
    collection: 'articles',
    id,
    data: { ...data, _status: live ? 'published' : 'draft' },
    draft: !live,
    user,
    overrideAccess: false,
    context: { connectorLiveEdit: live },
  })
  return { doc, live }
}

/** Finds an own article by id or by its source link. */
export async function findOwn(payload: Payload, user: any, args: any) {
  if (args.id !== undefined) return ownArticle(payload, user, Number(args.id))
  const key = normalizeUrl(args.source_url)
  if (!key) throw new UserError('missing_field', 'Потрібен id або source_url', { field: 'id' })
  const own = (await articlesBySource(payload, key)).find((d: any) => idOf(d.createdBy) === user.id)
  if (!own) throw new UserError('not_found', 'Серед ваших матеріалів немає статті з цим джерелом')
  return ownArticle(payload, user, own.id)
}

// Title similarity 0–1: shared word stems (first 5 letters), Dice coefficient.
const stems = (s: string) =>
  new Set(
    String(s || '')
      .toLowerCase()
      .replace(/[’'`ʼ]/g, '')
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length > 2)
      .map((w) => w.slice(0, 5)),
  )
export function similarity(a: string, b: string) {
  const A = stems(a)
  const B = stems(b)
  if (!A.size || !B.size) return 0
  let common = 0
  for (const w of A) if (B.has(w)) common++
  return Math.round(((2 * common) / (A.size + B.size)) * 100) / 100
}

/** Drafts and published: exact source link match, then similar titles among the latest 500. */
export async function findDuplicates(payload: Payload, args: any) {
  const limit = Math.min(Math.max(Number(args.limit) || 5, 1), 20)
  const out = new Map<number, any>()
  const key = args.source_url ? normalizeUrl(args.source_url) : null
  if (args.source_url && !key) throw new UserError('invalid_field', 'source_url: лише http(s)', { field: 'source_url' })
  if (!key && !args.title) throw new UserError('missing_field', 'Потрібен source_url і/або title', { field: 'source_url' })
  if (key) for (const d of await articlesBySource(payload, key)) out.set(d.id, { d, score: 1, reason: 'source_url' })
  if (args.title) {
    const title = clip(args.title, 300, 'title')
    const recent = await payload.find({
      collection: 'articles',
      draft: true,
      sort: '-updatedAt',
      limit: 500,
      depth: 0,
      overrideAccess: true,
      select: { title: true, _status: true, updatedAt: true, publishedAt: true },
    })
    for (const d of recent.docs as any[]) {
      const score = similarity(title, d.title)
      if (score < 0.4) continue
      const prev = out.get(d.id)
      if (prev) prev.reason = 'source_url+title'
      else out.set(d.id, { d, score, reason: 'title' })
    }
  }
  return [...out.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ d, score, reason }) => ({ id: d.id, title: String(d.title).slice(0, 120), date: String(d.publishedAt || d.updatedAt).slice(0, 10), status: d._status, score, reason }))
}

/** Stores a photo (metadata stripped) and makes it the article cover. */
export async function setCover(
  payload: Payload,
  user: any,
  id: number,
  buf: Buffer,
  meta: { alt: string; credit: string; caption?: string; license?: string; confirm_published?: unknown },
  allowLive = false,
) {
  await ownArticle(payload, user, id)
  const alt = noHtml(clip(meta.alt, 300, 'alt'), 'alt')
  const credit = noHtml(clip(meta.credit, 300, 'credit'), 'credit')
  if (!alt || !credit) throw new UserError('missing_field', 'Потрібні alt (що зображено) і credit (автор / джерело фото)', { field: !alt ? 'alt' : 'credit' })
  const live = allowLive ? await isPublished(payload, id) : await liveGuard(payload, id, meta.confirm_published)
  const info = await inspectImage(buf)
  // Re-encode: applies rotation and drops EXIF (GPS location, camera, owner).
  const clean = await sharp(buf, { limitInputPixels: 80_000_000 }).rotate().toFormat(info.ext === 'jpg' ? 'jpeg' : (info.ext as any)).toBuffer()
  const media: any = await payload.create({
    collection: 'media',
    data: {
      alt,
      credit,
      caption: meta.caption ? noHtml(clip(meta.caption, 500, 'caption'), 'caption') : undefined,
      license: meta.license ? noHtml(clip(meta.license, 300, 'license'), 'license') : undefined,
    },
    file: { data: clean, mimetype: info.mimetype, name: `${slugify(alt).slice(0, 60) || 'foto'}.${info.ext}`, size: clean.length },
    user,
    overrideAccess: false,
  })
  await payload.update({
    collection: 'articles',
    id,
    data: { hero: media.id, _status: live ? 'published' : 'draft' },
    draft: !live,
    user,
    overrideAccess: false,
    context: { connectorLiveEdit: live },
  })
  return { media, width: info.width, height: info.height, live }
}

/** Short result (well under 1 KB). */
export function summary(doc: any, live?: boolean) {
  const isLive = live ?? doc._status === 'published'
  return { id: doc.id, status: isLive ? 'published' : 'draft', edit_url: adminUrl(doc.id), url: isLive ? publicUrl(doc) : undefined }
}
