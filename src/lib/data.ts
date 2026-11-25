import 'server-only'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { draftMode } from 'next/headers'
import { cache } from 'react'
import { getPayload, type Where } from 'payload'
import type { Article, Author, Epoch, Media, Region, Tag } from '../payload-types'
import { PAGE_SIZE, typeByValue } from './constants'

export const payload = cache(async () => getPayload({ config }))

// Site content is cached between requests under one tag. Any change in the admin
// purges it (see lib/revalidate.ts); the 60 s lifetime also picks up scheduled posts.
export const CONTENT_TAG = 'content'
export const cached = <A extends unknown[], R>(name: string, fn: (...args: A) => Promise<R>) =>
  (...args: A): Promise<R> =>
    unstable_cache(() => fn(...args), [name, JSON.stringify(args)], { tags: [CONTENT_TAG], revalidate: 60 })()

const published: Where = { _status: { equals: 'published' } }
const live = (): Where => ({ and: [published, { publishedAt: { less_than_equal: new Date().toISOString() } }] })

// Fields needed for cards and lists (keeps queries light).
const CARD = {
  title: true,
  slug: true,
  type: true,
  lead: true,
  hero: true,
  publishedAt: true,
  authors: true,
  byline: true,
  primaryRegion: true,
  primaryEpoch: true,
  sponsor: true,
} as const

export type Card = Pick<Article, keyof typeof CARD | 'id'>

export const href = (a: Pick<Article, 'type' | 'slug'>) => `/${typeByValue(a.type)?.path}/${a.slug}`
export const img = (m: unknown): Media | null => (m && typeof m === 'object' ? (m as Media) : null)
export const rel = <T,>(v: unknown): T | null => (v && typeof v === 'object' ? (v as T) : null)
export const authorNames = (a: Pick<Article, 'authors' | 'byline'>) =>
  (a.authors || []).map((x) => rel<Author>(x)?.name).filter(Boolean).join(', ') || a.byline || ''

export const findArticles = cached('findArticles', async (opts: {
  where?: Where[]
  limit?: number
  page?: number
  exclude?: number[]
}): Promise<{ docs: Card[]; totalPages: number; totalDocs: number }> => {
  const p = await payload()
  const and: Where[] = [live(), ...(opts.where || [])]
  if (opts.exclude?.length) and.push({ id: { not_in: opts.exclude } })
  const res = await p.find({
    collection: 'articles',
    where: { and },
    sort: '-publishedAt',
    limit: opts.limit ?? PAGE_SIZE,
    page: opts.page ?? 1,
    depth: 1,
    select: CARD,
  })
  return { docs: res.docs as Card[], totalPages: res.totalPages, totalDocs: res.totalDocs }
})

// Keeps only published, already-live picks from a manual list, in editor order.
const livePicks = (list: unknown[] | null | undefined): Card[] => {
  const now = Date.now()
  return (list || [])
    .map((x) => rel<Article>(x))
    .filter((a): a is Article => !!a && a._status === 'published' && new Date(a.publishedAt).getTime() <= now) as Card[]
}

export const getHomepage = cache(cached('homepage', async () => {
  const p = await payload()
  const home = await p.findGlobal({ slug: 'homepage', depth: 2 })
  const textOfDay = livePicks([home.textOfDay])[0] || null
  const used = textOfDay ? [textOfDay.id] : []

  const news = await findArticles({ where: [{ type: { equals: 'news' } }], limit: home.newsCount || 12 })
  // «Головне сьогодні»: editor's picks in their order, topped up with the newest materials to the same count as the
  // news column (10–15), so a single pick no longer leaves the column almost empty. «Популярні» are not repeated here.
  const popular = livePicks(home.popular).slice(0, 5)
  const target = home.newsCount || 12
  let main = livePicks(home.mainToday).filter((a) => !used.includes(a.id)).slice(0, target)
  if (main.length < target) {
    const more = await findArticles({
      limit: target - main.length,
      exclude: [...used, ...main.map((m) => m.id), ...news.docs.map((n) => n.id), ...popular.map((x) => x.id)],
      where: [{ type: { not_in: ['partner'] } }],
    })
    main = [...main, ...more.docs]
  }

  const fill = async (pins: unknown[] | null | undefined, type: string) => {
    const picked = livePicks(pins)
    if (picked.length >= 5) return picked.slice(0, 5)
    const more = await findArticles({ where: [{ type: { equals: type } }], limit: 5 - picked.length, exclude: [...used, ...picked.map((x) => x.id)] })
    return [...picked, ...more.docs]
  }
  const [publications, specials, partners] = await Promise.all([
    fill(home.pinnedPublications, 'publication'),
    fill(home.pinnedSpecials, 'special'),
    findArticles({ where: [{ type: { equals: 'partner' } }], limit: 6 }).then((r) => r.docs),
  ])
  return { textOfDay, news: news.docs, main, publications, specials, partners, popular }
}))

export async function getArticle(typeValue: string, slug: string) {
  const { isEnabled: draft } = await draftMode()
  return draft ? queryArticle(typeValue, slug, true) : cachedArticle(typeValue, slug, false)
}

async function queryArticle(typeValue: string, slug: string, draft: boolean) {
  const p = await payload()
  const res = await p.find({
    collection: 'articles',
    where: { and: [{ slug: { equals: slug } }, { type: { equals: typeValue } }, ...(draft ? [] : [live()])] },
    draft,
    depth: 2,
    limit: 1,
    overrideAccess: draft,
  })
  return res.docs[0] || null
}
const cachedArticle = cached('article', queryArticle)

export async function getRelated(a: Article): Promise<Card[]> {
  const manual = livePicks(a.related).slice(0, 4)
  if (manual.length >= 4) return manual
  const ids = (v: unknown[] | null | undefined) => (v || []).map((x) => (typeof x === 'object' ? (x as { id: number }).id : x)) as number[]
  const tagIds = ids(a.tags)
  const or: Where[] = [{ primaryRegion: { equals: rel<Region>(a.primaryRegion)?.id } }, { primaryEpoch: { equals: rel<Epoch>(a.primaryEpoch)?.id } }]
  if (tagIds.length) or.unshift({ tags: { in: tagIds } })
  const auto = await findArticles({
    where: [{ or }, { type: { not_equals: 'partner' } }],
    limit: 4 - manual.length,
    exclude: [a.id, ...manual.map((m) => m.id)],
  })
  return [...manual, ...auto.docs]
}

export async function getSidebar(excludeId?: number) {
  const home = await getHomepage()
  const news = await findArticles({ where: [{ type: { equals: 'news' } }], limit: 5, exclude: excludeId ? [excludeId] : [] })
  return { news: news.docs, popular: home.popular.filter((x) => x.id !== excludeId) }
}

export const getTaxonomy = cache(cached('taxonomy', async () => {
  const p = await payload()
  const [regions, epochs] = await Promise.all([
    p.find({ collection: 'regions', sort: 'order', limit: 20, depth: 0 }),
    p.find({ collection: 'epochs', sort: 'order', limit: 30, depth: 0 }),
  ])
  return { regions: regions.docs as Region[], epochs: epochs.docs as Epoch[] }
}))

export const getSettings = cache(cached('settings', async () => (await payload()).findGlobal({ slug: 'settings', depth: 0 })))

async function queryBySlug<T extends 'regions' | 'epochs' | 'tags' | 'authors' | 'pages'>(collection: T, slug: string) {
  const p = await payload()
  const res = await p.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  return res.docs[0] || null
}
const cachedBySlug = cached('bySlug', queryBySlug as (collection: string, slug: string) => Promise<unknown>)
export const bySlug = <T extends 'regions' | 'epochs' | 'tags' | 'authors' | 'pages'>(collection: T, slug: string) =>
  cachedBySlug(collection, slug) as ReturnType<typeof queryBySlug<T>>

export type { Article, Author, Epoch, Media, Region, Tag }
