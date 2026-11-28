import { payload as getPayload } from '../../../lib/data'
import { keyFromResource, sign, verify } from '../../../lib/connector/oauth'
import { clientIp, connectorOff, privateHeaders, rateLimited, userByToken } from '../../../lib/connector/security'

export const dynamic = 'force-dynamic'

const page = (title: string, text: string, status = 400) =>
  new Response(
    `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:520px;margin:60px auto;padding:0 20px;color:#14181f}h1{font-size:22px}</style></head><body><h1>${title}</h1><p>${text}</p></body></html>`,
    { status, headers: { ...privateHeaders, 'Content-Type': 'text/html; charset=utf-8' } },
  )

// Authorization endpoint: no login screen. The connector key in the resource URL is the credential; when the
// client names it, it must be a valid, enabled link. The browser is sent straight back to the client with a code.
export async function GET(req: Request) {
  if (connectorOff()) return page('Конектор вимкнено', 'Конектор «Мідгард» тимчасово вимкнено адміністратором.', 404)
  if (rateLimited(`auth:${clientIp(req)}`, 60, 10 * 60 * 1000)) return page('Забагато спроб', 'Зачекайте 10 хвилин і спробуйте знову.', 429)
  const q = new URL(req.url).searchParams
  const client = verify('client', q.get('client_id') || '')
  const redirect = q.get('redirect_uri') || ''
  if (!client) return page('Помилка підключення', 'Невідомий клієнт. Видаліть конектор у Claude і додайте його знову.')
  if (!client.r.includes(redirect)) return page('Помилка підключення', 'Невідома адреса повернення. Видаліть конектор у Claude і додайте його знову.')

  const back = (params: Record<string, string>) => {
    const u = new URL(redirect)
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
    if (q.get('state')) u.searchParams.set('state', q.get('state')!)
    return Response.redirect(u.toString(), 302)
  }
  if (q.get('response_type') !== 'code') return back({ error: 'unsupported_response_type' })
  const challenge = q.get('code_challenge') || ''
  if (q.get('code_challenge_method') !== 'S256' || !/^[A-Za-z0-9_-]{43}$/.test(challenge)) return back({ error: 'invalid_request', error_description: 'PKCE S256 required' })

  const resource = q.get('resource')
  const linkKey = keyFromResource(resource)
  if (resource && !linkKey) return back({ error: 'invalid_target', error_description: 'Unknown resource' })
  if (linkKey) {
    const user = await userByToken(await getPayload(), linkKey)
    if (!user) return page('Посилання недійсне', 'Це посилання конектора не діє: його вимкнули або замінили новим. Попросіть в адміністратора сайту актуальне посилання й додайте конектор знову.', 404)
  }
  const code = sign('code', { c: q.get('client_id'), r: redirect, p: challenge, s: resource || '' }, 5 * 60 * 1000)
  return back({ code })
}
