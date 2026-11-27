import dns from 'dns'
import https from 'https'
import net from 'net'
import sharp from 'sharp'

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const MAX_PIXELS = 80_000_000
const FORMATS: Record<string, string> = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }

// Only public internet addresses: no localhost, private networks, Railway internal network, cloud metadata.
const blocked = new net.BlockList()
for (const [a, p] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
  ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
  ['224.0.0.0', 4], ['240.0.0.0', 4],
] as const) blocked.addSubnet(a, p, 'ipv4')
for (const [a, p] of [['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8], ['64:ff9b::', 96], ['2001:db8::', 32]] as const)
  blocked.addSubnet(a, p, 'ipv6')

export function isPublicIp(ip: string): boolean {
  const fam = net.isIP(ip)
  if (!fam) return false
  if (fam === 6) {
    const mapped = ip.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPublicIp(mapped[1])
    return !blocked.check(ip, 'ipv6')
  }
  return !blocked.check(ip, 'ipv4')
}

// DNS lookup that refuses non-public addresses. Used for the real connection, so a DNS
// answer that changes between check and connect (rebinding) is still caught.
const safeLookup: net.LookupFunction = (hostname, options, cb) => {
  dns.lookup(hostname, { all: true }, (err, addrs) => {
    if (err) return (cb as any)(err)
    const list = addrs as dns.LookupAddress[]
    if (!list.length || list.some((a) => !isPublicIp(a.address))) return (cb as any)(new Error('Адреса фото веде в закриту мережу'))
    const pick = list[0]
    if ((options as any)?.all) return (cb as any)(null, list)
    ;(cb as any)(null, pick.address, pick.family)
  })
}

function getOnce(url: URL): Promise<{ status: number; location?: string; type?: string; body?: Buffer }> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { lookup: safeLookup, timeout: 15000, headers: { 'User-Agent': 'MidgardBot/1.0 (+photo import)', Accept: 'image/jpeg,image/png,image/webp' } },
      (res) => {
        const status = res.statusCode || 0
        if (status >= 300 && status < 400) {
          res.resume()
          return resolve({ status, location: res.headers.location })
        }
        if (status !== 200) {
          res.resume()
          return resolve({ status })
        }
        const declared = Number(res.headers['content-length'] || 0)
        if (declared > MAX_IMAGE_BYTES) {
          res.destroy()
          return reject(new Error('Фото більше за 20 МБ'))
        }
        const chunks: Buffer[] = []
        let size = 0
        res.on('data', (c: Buffer) => {
          size += c.length
          if (size > MAX_IMAGE_BYTES) {
            res.destroy()
            reject(new Error('Фото більше за 20 МБ'))
          } else chunks.push(c)
        })
        res.on('end', () => resolve({ status, type: String(res.headers['content-type'] || ''), body: Buffer.concat(chunks) }))
        res.on('error', reject)
      },
    )
    req.on('timeout', () => req.destroy(new Error('Сайт із фото не відповідає')))
    req.on('error', (e: any) =>
      reject(/^(Адреса фото|Сайт із фото|Фото)/.test(String(e?.message)) ? e : new Error('Не вдалося завантажити фото: сайт недоступний або адреса неправильна')),
    )
  })
}

function checkUrl(raw: string): URL {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    throw new Error('Неправильне посилання на фото')
  }
  if (u.protocol !== 'https:') throw new Error('Потрібне посилання, що починається з https://')
  if (u.port && u.port !== '443') throw new Error('Посилання з нестандартним портом не підтримуються')
  if (u.username || u.password) throw new Error('Посилання з логіном і паролем не підтримуються')
  const host = u.hostname.replace(/^\[|\]$/g, '')
  if (net.isIP(host) && !isPublicIp(host)) throw new Error('Адреса фото веде в закриту мережу')
  return u
}

/** Downloads a photo from a public https link (up to 3 redirects, 20 MB). */
export async function downloadImage(raw: string): Promise<Buffer> {
  let url = checkUrl(raw)
  for (let i = 0; i < 4; i++) {
    const r = await getOnce(url)
    if (r.location) {
      if (i === 3) throw new Error('Забагато перенаправлень')
      url = checkUrl(new URL(r.location, url).toString())
      continue
    }
    if (r.status !== 200 || !r.body) throw new Error(`Сайт із фото відповів помилкою ${r.status}. Потрібне пряме посилання на файл`)
    return r.body
  }
  throw new Error('Не вдалося завантажити фото')
}

/** Checks that the bytes really are a JPEG/PNG/WEBP photo of sane size. */
export async function inspectImage(buf: Buffer): Promise<{ mimetype: string; ext: string; width: number; height: number }> {
  if (buf.length > MAX_IMAGE_BYTES) throw new Error('Фото більше за 20 МБ')
  let meta: Awaited<ReturnType<ReturnType<typeof sharp>['metadata']>>
  try {
    meta = await sharp(buf, { limitInputPixels: MAX_PIXELS }).metadata()
  } catch {
    throw new Error('Це не фото або файл пошкоджений. Підходять JPG, PNG, WEBP')
  }
  const mimetype = FORMATS[meta.format || '']
  if (!mimetype || !meta.width || !meta.height) throw new Error('Підходять лише JPG, PNG і WEBP')
  return { mimetype, ext: meta.format === 'jpeg' ? 'jpg' : meta.format!, width: meta.width, height: meta.height }
}
