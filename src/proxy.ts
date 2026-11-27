import { NextResponse, type NextRequest } from 'next/server'

// Test stage: whole site behind HTTP Basic Auth when SITE_PASSWORD is set, and never indexed.
export function proxy(req: NextRequest) {
  // The Claude connector has no OAuth: answer discovery with 404 (not Basic Auth 401), so Claude connects without a login.
  if (req.nextUrl.pathname.startsWith('/.well-known/oauth')) return new NextResponse('Not found', { status: 404 })
  const pass = process.env.SITE_PASSWORD
  if (pass) {
    const user = process.env.SITE_USER || 'midgard'
    const header = req.headers.get('authorization') || ''
    const [scheme, encoded] = header.split(' ')
    const ok = scheme === 'Basic' && encoded && atob(encoded) === `${user}:${pass}`
    if (!ok) return new NextResponse('Потрібна авторизація', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Midgard test", charset="UTF-8"' } })
  }
  const res = NextResponse.next()
  if (process.env.SITE_NOINDEX === '1') res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return res
}

// /mcp/<secret> and /foto/<signed link> have their own secret-link check and headers (lib/connector).
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|mcp/[^/]+$|foto/[^/]+$).*)'] }
