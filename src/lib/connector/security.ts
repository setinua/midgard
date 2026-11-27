import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto'
import type { Payload } from 'payload'

/** Kill switch: CONNECTOR_DISABLED=1 in Railway variables closes /mcp and /foto for everyone. */
export const connectorOff = () => /^(1|true|yes)$/i.test(process.env.CONNECTOR_DISABLED || '')

// Connector secret: 32 random bytes in the URL; only its SHA-256 is used for lookup.
export const newConnectorToken = () => randomBytes(32).toString('base64url')
export const hashToken = (t: string) => createHash('sha256').update(t).digest('hex')
const TOKEN_RE = /^[A-Za-z0-9_-]{40,64}$/

export const connectorUrl = (token: string) => `${(process.env.SERVER_URL || '').replace(/\/$/, '')}/mcp/${token}`

/** The user behind a connector link, or null (unknown, disabled, or malformed link). */
export async function userByToken(payload: Payload, token: string): Promise<any | null> {
  if (!TOKEN_RE.test(token)) return null
  const res = await payload.find({
    collection: 'users',
    where: { and: [{ connectorTokenHash: { equals: hashToken(token) } }, { connectorEnabled: { equals: true } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
  })
  const u = res.docs[0]
  return u ? { ...u, collection: 'users' } : null
}

// Simple in-memory limiter (one server instance). Key → timestamps in the window.
const hits = new Map<string, number[]>()
const WINDOW_MAX = 60 * 60 * 1000
/** Records a hit and says whether the key went over `max` hits in the window. */
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  hit(key)
  return recent(key, windowMs) > max
}
export function hit(key: string) {
  const now = Date.now()
  const list = (hits.get(key) || []).filter((t) => now - t < WINDOW_MAX)
  list.push(now)
  hits.set(key, list)
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MAX)) hits.delete(k)
}
/** Hits in the last windowMs, without recording a new one. */
export function recent(key: string, windowMs: number): number {
  const now = Date.now()
  return (hits.get(key) || []).filter((t) => now - t < windowMs).length
}

export const clientIp = (req: Request) =>
  (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'

// Photo upload links: signed, tied to one article and one user, valid 24 hours. No database needed.
const uploadKey = () => {
  const s = process.env.PAYLOAD_SECRET
  if (!s) throw new Error('PAYLOAD_SECRET is not set')
  return createHash('sha256').update(`midgard-photo-upload:${s}`).digest()
}
export const UPLOAD_TTL_MS = 24 * 60 * 60 * 1000

// `linkHash` binds the photo link to the current connector link: a new connector link (or switching it off) kills it.
export function signUpload(articleId: number, userId: number, linkHash: string): string {
  const body = Buffer.from(JSON.stringify({ a: articleId, u: userId, h: String(linkHash).slice(0, 16), e: Date.now() + UPLOAD_TTL_MS, n: randomBytes(6).toString('base64url') })).toString('base64url')
  const sig = createHmac('sha256', uploadKey()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyUpload(token: string): { articleId: number; userId: number; linkHash: string; expires: number } | null {
  const [body, sig] = String(token || '').split('.')
  if (!body || !sig || body.length > 300) return null
  const expected = createHmac('sha256', uploadKey()).update(body).digest()
  const got = Buffer.from(sig, 'base64url')
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!Number.isInteger(p.a) || !Number.isInteger(p.u) || typeof p.h !== 'string' || p.h.length !== 16 || typeof p.e !== 'number' || p.e < Date.now()) return null
    return { articleId: p.a, userId: p.u, linkHash: p.h, expires: p.e }
  } catch {
    return null
  }
}

export const uploadUrl = (token: string) => `${(process.env.SERVER_URL || '').replace(/\/$/, '')}/foto/${token}`

// Headers for every connector / upload response: never cached, never indexed, no referrer (the link is a secret).
export const privateHeaders: Record<string, string> = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
}

/** Reads a request body, refusing more than `max` bytes even without Content-Length. */
export async function readBody(req: Request, max: number): Promise<Buffer | null> {
  if (Number(req.headers.get('content-length') || 0) > max) return null
  if (!req.body) return Buffer.alloc(0)
  const reader = req.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    if (size > max) {
      await reader.cancel().catch(() => {})
      return null
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks)
}
