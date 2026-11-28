import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

/**
 * Readiness check for Railway (healthcheck path) and the admin "site updated" banner.
 * 200 only when Payload is initialised and the database answers; `version` changes with every deployment.
 */
export async function GET() {
  const version = process.env.RAILWAY_DEPLOYMENT_ID || 'local'
  try {
    const payload = await getPayload({ config })
    await payload.count({ collection: 'pages' })
    return Response.json({ ok: true, version }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ ok: false, version }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
