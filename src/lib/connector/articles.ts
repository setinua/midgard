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

export class UserError extends Error {}

const idOf = (v: any) => (v && typeof v === 'object' ? v.id : v)

export const publicUrl = (doc: any) => {
  const t = typeByValue(String(doc?.type || ''))
  return t && doc?.slug ? `${SITE()}/${t.path}/${doc.slug}` : null
}
export const adminUrl = (id: number | string) => `${SITE()}/admin/collections/articles/${id}`

/** Latest version (draft or published) of an article this user created; throws otherwise. */
export async function ownArticle(payload: Payload, user: any, id: number) {
  if (!Number.isInteger(id) || id <= 0) throw new UserError('Неправильний номер матеріалу')
  let doc: any
  try {
    doc = await payload.findByID({ collection: 'articles', id, draft: true, depth: 0, user, overrideAccess: false })
  } catch {
    doc = null
  }
  if (!doc || idOf(doc.createdBy) !== user.id) throw new UserError('Матеріал не знайдено серед ваших')
  return doc
}

async function isPublished(payload: Payload, id: number) {
  const live = await payload.find({ collection: 'articles', where: { and: [{ id: { equals: id } }, { _status: { equals: 'published' } }] }, limit: 1, depth: 0, overrideAccess: true })
  return live.totalDocs > 0
}

async function idsBySlug(payload: Payload, collection: 'regions' | 'epochs' | 'tags', slugs: string[]) {
  if (!slugs.length) return []
  const res = await payload.find({ collection, where: { slug: { in: slugs } }, limit: 100, depth: 0 })
  const found = new Map(res.docs.map((d: any) => [d.slug, d.id]))
  const missing = slugs.filter((s) => !found.has(s))
  if (missing.length) throw new UserError(`Невідомі ${collection === 'regions' ? 'регіони' : collection === 'epochs' ? 'епохи' : 'теги'}: ${missing.join(', ')}. Перелік дає get_site_info`)
  return slugs.map((s) => found.get(s))
}

const clip = (v: unknown, max: number, name: string) => {
  const s = String(v ?? '').trim()
  if (s.length > max) throw new UserError(`${name}: задовго (до ${max} знаків)`)
  return s
}

/** Validates connector input and turns it into Payload article data. */
async function toData(payload: Payload, input: any, current?: any) {
  const data: any = {}
  if (input.title !== undefined) {
    data.title = clip(input.title, 300, 'Заголовок')
    if (!data.title) throw new UserError('Заголовок порожній')
  }
  if (input.lead !== undefined) data.lead = clip(input.lead, 1000, 'Анотація')
  if (input.type !== undefined) {
    if (!ALLOWED_TYPES.includes(input.type)) throw new UserError(`Тип має бути одним із: ${ALLOWED_TYPES.join(', ')}`)
    data.type = input.type
  }
  if (input.content_markdown !== undefined) {
    const md = clip(input.content_markdown, 100000, 'Текст')
    const keep = current ? lexicalToMarkdown(current.content).keep : []
    data.content = markdownToLexical(md, keep)
  }
  if (input.sources !== undefined) {
    if (!Array.isArray(input.sources) || input.sources.length > 30) throw new UserError('Джерела: список до 30 пунктів')
    data.sources = input.sources.map((s: any) => {
      const title = clip(s?.title, 300, 'Назва джерела')
      const url = s?.url ? clip(s.url, 2000, 'Посилання джерела') : ''
      if (!title) throw new UserError('У кожного джерела має бути назва')
      if (url && !isSafeUrl(url)) throw new UserError(`Посилання джерела має починатися з http:// або https://: ${url}`)
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

export async function createArticle(payload: Payload, user: any, input: any) {
  const data = await toData(payload, { type: 'news', ...input })
  for (const k of ['title', 'lead', 'content', 'primaryRegion', 'primaryEpoch'] as const)
    if (!data[k]) throw new UserError(`Не вистачає поля ${k}`)
  if (data.type === 'news' && !data.sources?.length) throw new UserError('Для новини потрібне хоча б одне джерело')
  data.slug = await freeSlug(payload, slugify(data.title))
  data._status = 'draft'
  const doc: any = await payload.create({ collection: 'articles', data, draft: true, user, overrideAccess: false })
  return doc
}

/** Saves changes. A published article stays published and changes go live; a draft stays a draft. */
export async function updateArticle(payload: Payload, user: any, id: number, input: any) {
  const current = await ownArticle(payload, user, id)
  const data = await toData(payload, input, current)
  if (!Object.keys(data).length) throw new UserError('Немає що змінювати')
  const live = await isPublished(payload, id)
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

/** Stores a photo (metadata stripped) and makes it the article cover. */
export async function setCover(payload: Payload, user: any, id: number, buf: Buffer, meta: { alt: string; credit: string; caption?: string; license?: string }) {
  await ownArticle(payload, user, id)
  const alt = clip(meta.alt, 300, 'Опис фото')
  const credit = clip(meta.credit, 300, 'Автор фото')
  if (!alt || !credit) throw new UserError('Потрібні опис фото (що зображено) і автор або джерело фото')
  const info = await inspectImage(buf)
  // Re-encode: applies rotation and drops EXIF (GPS location, camera, owner).
  const clean = await sharp(buf, { limitInputPixels: 80_000_000 }).rotate().toFormat(info.ext === 'jpg' ? 'jpeg' : (info.ext as any)).toBuffer()
  const media: any = await payload.create({
    collection: 'media',
    data: { alt, credit, caption: meta.caption ? clip(meta.caption, 500, 'Підпис') : undefined, license: meta.license ? clip(meta.license, 300, 'Ліцензія') : undefined },
    file: { data: clean, mimetype: info.mimetype, name: `${slugify(alt).slice(0, 60) || 'foto'}.${info.ext}`, size: clean.length },
    user,
    overrideAccess: false,
  })
  const live = await isPublished(payload, id)
  await payload.update({
    collection: 'articles',
    id,
    data: { hero: media.id, _status: live ? 'published' : 'draft' },
    draft: !live,
    user,
    overrideAccess: false,
    context: { connectorLiveEdit: live },
  })
  return { media, width: info.width, live }
}

export function summary(doc: any, live?: boolean) {
  return {
    id: doc.id,
    title: doc.title,
    type: doc.type,
    status: live === undefined ? doc._status : live ? 'published' : 'draft',
    publishedAt: doc.publishedAt,
    updatedAt: doc.updatedAt,
    adminUrl: adminUrl(doc.id),
    siteUrl: (live ?? doc._status === 'published') ? publicUrl(doc) : null,
  }
}
