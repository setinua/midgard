import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { privateHeaders } from './security'

/**
 * OAuth 2.1 compatibility layer for the Claude connector.
 *
 * Access is still granted ONLY by the secret key in the connector link (/mcp/<key>): the MCP endpoint ignores
 * bearer tokens. Some Claude clients, though, insist on an OAuth handshake while adding a connector (discovery →
 * dynamic client registration → authorize → token) and give up when it is missing. These endpoints complete that
 * handshake automatically, with no login screen: when the client names the resource (/mcp/<key>), the key must be
 * valid, otherwise authorize answers with an error. Codes and tokens are stateless HMAC-signed strings.
 */

export const base = () => (process.env.SERVER_URL || '').replace(/\/$/, '')

const key = () => {
  const s = process.env.PAYLOAD_SECRET
  if (!s) throw new Error('PAYLOAD_SECRET is not set')
  return createHash('sha256').update(`midgard-connector-oauth:${s}`).digest()
}

export function sign(kind: string, data: Record<string, unknown>, ttlMs: number): string {
  const body = Buffer.from(JSON.stringify({ k: kind, ...data, e: Date.now() + ttlMs, n: randomBytes(6).toString('base64url') })).toString('base64url')
  return `${body}.${createHmac('sha256', key()).update(body).digest('base64url')}`
}

export function verify(kind: string, token: string): Record<string, any> | null {
  const [body, sig] = String(token || '').split('.')
  if (!body || !sig || body.length > 4000) return null
  const expected = createHmac('sha256', key()).update(body).digest()
  const got = Buffer.from(sig, 'base64url')
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    return p.k === kind && typeof p.e === 'number' && p.e > Date.now() ? p : null
  } catch {
    return null
  }
}

/** Connector key from a resource URL like https://midgard.news/mcp/<key>, or null. */
export function keyFromResource(resource: string | null): string | null {
  if (!resource) return null
  try {
    const u = new URL(resource)
    if (`${u.protocol}//${u.host}` !== base()) return null
    const m = u.pathname.match(/^\/mcp\/([A-Za-z0-9_-]{40,64})\/?$/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

/** Redirect URIs a client may register: https anywhere, http only for localhost (desktop / CLI clients). */
export function allowedRedirect(uri: unknown): uri is string {
  if (typeof uri !== 'string' || uri.length > 500) return false
  try {
    const u = new URL(uri)
    if (u.hash) return false
    if (u.protocol === 'https:') return true
    return u.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname)
  } catch {
    return false
  }
}

export const pkceOk = (verifier: string, challenge: string) =>
  typeof verifier === 'string' && /^[A-Za-z0-9._~-]{43,128}$/.test(verifier) && createHash('sha256').update(verifier).digest('base64url') === challenge

export const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...privateHeaders, 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...extra } })

export const oauthError = (error: string, description: string, status = 400) => json({ error, error_description: description }, status)

export const authServerMetadata = () => ({
  issuer: base(),
  authorization_endpoint: `${base()}/oauth/authorize`,
  token_endpoint: `${base()}/oauth/token`,
  registration_endpoint: `${base()}/register`,
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
  code_challenge_methods_supported: ['S256'],
  token_endpoint_auth_methods_supported: ['none'],
  scopes_supported: ['connector'],
})

export const ACCESS_TTL = 30 * 24 * 3600 * 1000
export const REFRESH_TTL = 365 * 24 * 3600 * 1000
