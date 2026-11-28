import { ACCESS_TTL, REFRESH_TTL, json, oauthError, pkceOk, sign, verify } from '../../../lib/connector/oauth'
import { clientIp, rateLimited, readBody } from '../../../lib/connector/security'

export const dynamic = 'force-dynamic'

async function params(req: Request): Promise<URLSearchParams | null> {
  const raw = await readBody(req, 16 * 1024)
  if (!raw) return null
  const text = raw.toString('utf8')
  if ((req.headers.get('content-type') || '').includes('application/json')) {
    try {
      return new URLSearchParams(Object.entries(JSON.parse(text || '{}')).map(([k, v]) => [k, String(v)]))
    } catch {
      return null
    }
  }
  return new URLSearchParams(text)
}

// Authorization codes are single-use: remember spent ones until they expire (one server instance).
const spent = new Map<string, number>()
function spend(nonce: string, expires: number): boolean {
  const now = Date.now()
  for (const [k, e] of spent) if (e < now) spent.delete(k)
  if (spent.has(nonce)) return false
  spent.set(nonce, expires)
  return true
}

const tokens = (clientId: string, resource: string) => ({
  access_token: sign('access', { c: clientId.slice(0, 40), s: resource }, ACCESS_TTL),
  token_type: 'Bearer',
  expires_in: Math.floor(ACCESS_TTL / 1000),
  refresh_token: sign('refresh', { c: clientId, s: resource }, REFRESH_TTL),
  scope: 'connector',
})

// Token endpoint for public clients (PKCE, no client secret). Tokens carry no rights of their own:
// the MCP endpoint authorizes by the key in the link.
export async function POST(req: Request) {
  if (rateLimited(`tok:${clientIp(req)}`, 60, 10 * 60 * 1000)) return oauthError('temporarily_unavailable', 'Забагато запитів', 429)
  const p = await params(req)
  if (!p) return oauthError('invalid_request', 'Неправильний запит')
  const clientId = p.get('client_id') || ''
  if (!verify('client', clientId)) return oauthError('invalid_client', 'Невідомий клієнт', 401)

  if (p.get('grant_type') === 'authorization_code') {
    const code = verify('code', p.get('code') || '')
    if (!code || code.c !== clientId || code.r !== p.get('redirect_uri')) return oauthError('invalid_grant', 'Код недійсний або прострочений')
    if (!pkceOk(p.get('code_verifier') || '', code.p)) return oauthError('invalid_grant', 'PKCE не збігається')
    if (!spend(code.n, code.e)) return oauthError('invalid_grant', 'Код уже використано')
    return json(tokens(clientId, code.s))
  }
  if (p.get('grant_type') === 'refresh_token') {
    const rt = verify('refresh', p.get('refresh_token') || '')
    if (!rt || rt.c !== clientId) return oauthError('invalid_grant', 'Токен оновлення недійсний')
    return json(tokens(clientId, rt.s))
  }
  return oauthError('unsupported_grant_type', 'Підтримуються authorization_code і refresh_token')
}
