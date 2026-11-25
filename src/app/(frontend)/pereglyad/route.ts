import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { payload } from '../../../lib/data'

export const dynamic = 'force-dynamic'

// Preview from the admin («Переглянути»): turns on draft mode for a logged-in user
// and opens the page with the latest saved version, draft or published.
// /pereglyad?path=/novyny/slug — open; /pereglyad?exit=1 — back to the public version.
export async function GET(req: Request) {
  const url = new URL(req.url)
  const dm = await draftMode()
  if (url.searchParams.get('exit')) {
    dm.disable()
    redirect(safePath(url.searchParams.get('path')))
  }
  const { user } = await (await payload()).auth({ headers: req.headers })
  if (!user) return new Response('Перегляд доступний лише після входу в адмінку.', { status: 401, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  dm.enable()
  redirect(safePath(url.searchParams.get('path')))
}

// Only same-site paths, never another host.
function safePath(p: string | null): string {
  return p && p.startsWith('/') && !p.startsWith('//') && !p.includes('\\') ? p : '/'
}
