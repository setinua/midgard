import { allowedRedirect, json, oauthError, sign } from '../../lib/connector/oauth'
import { clientIp, rateLimited, readBody } from '../../lib/connector/security'

export const dynamic = 'force-dynamic'

// RFC 7591 dynamic client registration. Stateless: the client_id is a signed record of the redirect URIs.
export async function POST(req: Request) {
  if (rateLimited(`reg:${clientIp(req)}`, 30, 10 * 60 * 1000)) return oauthError('temporarily_unavailable', 'Забагато запитів', 429)
  const raw = await readBody(req, 16 * 1024)
  if (!raw) return oauthError('invalid_client_metadata', 'Запит завеликий')
  let meta: any
  try {
    meta = JSON.parse(raw.toString('utf8') || '{}')
  } catch {
    return oauthError('invalid_client_metadata', 'Очікується JSON')
  }
  const uris: unknown[] = Array.isArray(meta.redirect_uris) ? meta.redirect_uris : []
  if (!uris.length || uris.length > 10 || !uris.every(allowedRedirect)) return oauthError('invalid_redirect_uri', 'redirect_uris: лише https або http://localhost')
  const name = typeof meta.client_name === 'string' ? meta.client_name.slice(0, 100) : 'Claude'
  const clientId = sign('client', { r: uris, c: name }, 10 * 365 * 24 * 3600 * 1000)
  return json(
    {
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: name,
      redirect_uris: uris,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    },
    201,
  )
}
