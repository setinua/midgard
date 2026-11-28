import { base, json } from '../../../../lib/connector/oauth'

export const dynamic = 'force-dynamic'

// RFC 9728 protected resource metadata. /.well-known/oauth-protected-resource/mcp/<key> describes that connector link;
// the bare path describes /mcp in general. The key itself is not checked here (authorize does that).
export async function GET(_: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params
  const resource = path.length ? `${base()}/${path.map(encodeURIComponent).join('/')}` : `${base()}/mcp`
  if (path.length && path[0] !== 'mcp') return json({ error: 'not_found' }, 404)
  return json({ resource, authorization_servers: [base()], bearer_methods_supported: ['header'], scopes_supported: ['connector'], resource_name: 'Мідгард' })
}
