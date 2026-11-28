import { authServerMetadata, json } from '../../../../lib/connector/oauth'

export const dynamic = 'force-dynamic'

// RFC 8414 authorization server metadata (also answered with a path suffix, as some clients ask for it that way).
export async function GET() {
  return json(authServerMetadata())
}
