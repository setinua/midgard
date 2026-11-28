import { authServerMetadata, json } from '../../../lib/connector/oauth'

export const dynamic = 'force-dynamic'

export async function GET() {
  return json(authServerMetadata())
}
