import sharp from 'sharp'
import { SITE_URL } from '../../../../lib/constants'
import { payload } from '../../../../lib/data'

// Social preview 1200×630 JPEG for any image (photos narrower than 1200 px get no "og" size on upload).
// /og/<media id>.jpg — cached for a year by browsers and Cloudflare; a new photo gets a new id.
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const id = Number((await params).file.replace(/\.jpg$/, ''))
  if (!Number.isInteger(id) || id <= 0) return new Response('Not found', { status: 404 })
  const p = await payload()
  const m = await p.findByID({ collection: 'media', id, depth: 0, disableErrors: true })
  if (!m?.url || !String(m.mimeType || '').startsWith('image/')) return new Response('Not found', { status: 404 })
  const src = m.url.startsWith('http') ? m.url : `${SITE_URL}${m.url}`
  const res = await fetch(src)
  if (!res.ok) return new Response('Not found', { status: 404 })
  const jpg = await sharp(Buffer.from(await res.arrayBuffer()))
    .rotate()
    .resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer()
  return new Response(new Uint8Array(jpg), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' },
  })
}
