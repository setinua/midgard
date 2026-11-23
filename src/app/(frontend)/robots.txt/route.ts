import { SITE_URL } from '../../../lib/constants'

export const dynamic = 'force-dynamic'

export function GET() {
  const body =
    process.env.SITE_NOINDEX === '1'
      ? 'User-agent: *\nDisallow: /\n'
      : `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\nDisallow: /poshuk\n\nSitemap: ${SITE_URL}/sitemap.xml\nSitemap: ${SITE_URL}/news-sitemap.xml\n`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
