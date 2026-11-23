import { SITE_NAME } from '../../../lib/constants'
import { findArticles, rss, xml } from '../../../lib/feeds'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { docs } = await findArticles({ limit: 50 })
  return xml(rss(SITE_NAME, docs, '/rss.xml'))
}
