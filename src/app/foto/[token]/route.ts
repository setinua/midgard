import { payload as getPayload } from '../../../lib/data'
import { UserError, ownArticle, setCover } from '../../../lib/connector/articles'
import { MAX_IMAGE_BYTES } from '../../../lib/connector/images'
import { clientIp, connectorOff, privateHeaders, rateLimited, readBody, verifyUpload } from '../../../lib/connector/security'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Photo upload page for the Claude connector: /foto/<signed link>.
// The link (from get_photo_upload_link) is tied to one article and one journalist and lives 24 hours.

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const page = (body: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Фото до матеріалу — Мідгард</title>
<style>body{font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:#f6f4ef;color:#1d1b16}main{max-width:560px;margin:0 auto;padding:32px 20px}h1{font-size:22px;margin:0 0 4px}p.muted{color:#6b665c;margin-top:0}label{display:block;font-weight:600;margin:18px 0 6px}input[type=text],input[type=file]{width:100%;box-sizing:border-box;padding:12px;border:1px solid #cfc9bc;border-radius:8px;background:#fff;font:inherit}small{color:#6b665c}button{margin-top:24px;width:100%;padding:14px;border:0;border-radius:8px;background:#1d1b16;color:#fff;font:600 16px system-ui,sans-serif;cursor:pointer}.box{background:#fff;border-radius:12px;padding:20px;margin-top:20px}.err{background:#fdecea;color:#8a1f11;padding:12px;border-radius:8px}.ok{background:#e8f5e9;color:#1b5e20;padding:12px;border-radius:8px}</style></head>
<body><main>${body}</main></body></html>`,
    {
      status,
      headers: {
        ...privateHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
        'X-Frame-Options': 'DENY',
      },
    },
  )

// curl and scripts (no text/html in Accept) get short JSON instead of the page.
const wantsJson = (req: Request) => !(req.headers.get('accept') || '').includes('text/html')
const jsonReply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...privateHeaders, 'Content-Type': 'application/json' } })

const expired = () =>
  page(`<h1>Посилання не діє</h1><p class="err">Посилання застаріло (діє 24 години) або неправильне. Попросіть у Claude нове: «Дай посилання для завантаження фото до новини про …».</p>`, 404)

async function context(req: Request, token: string) {
  if (rateLimited(`foto:${clientIp(req)}`, 60, 10 * 60 * 1000)) return { error: page('<h1>Забагато спроб</h1><p class="err">Зачекайте 10 хвилин.</p>', 429) }
  if (connectorOff()) return { error: new Response('Not found', { status: 404, headers: privateHeaders }) }
  const t = verifyUpload(token)
  if (!t) return { error: wantsJson(req) ? jsonReply({ error: 'link_expired', hint: 'Посилання застаріло або неправильне: get_photo_upload_link' }, 404) : expired() }
  const payload = await getPayload()
  let user: any
  try {
    user = await payload.findByID({ collection: 'users', id: t.userId, depth: 0, overrideAccess: true, showHiddenFields: true })
  } catch {
    return { error: expired() }
  }
  if (!user?.connectorEnabled || String(user.connectorTokenHash || '').slice(0, 16) !== t.linkHash) return { error: expired() }
  user = { ...user, collection: 'users' }
  try {
    const article = await ownArticle(payload, user, t.articleId)
    return { payload, user, article, t }
  } catch {
    return { error: expired() }
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const c = await context(req, token)
  if ('error' in c) return c.error
  const until = new Date(c.t.expires).toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv', dateStyle: 'short', timeStyle: 'short' })
  return page(`<h1>Фото-обкладинка</h1><p class="muted">до матеріалу «${esc(c.article.title)}»</p>
<form class="box" method="post" enctype="multipart/form-data">
<label for="f">Фото</label><input id="f" type="file" name="file" accept="image/jpeg,image/png,image/webp" required>
<small>JPG, PNG або WEBP до 20 МБ. Краще горизонтальне, від 1200 px завширшки.</small>
<label for="alt">Що на фото</label><input id="alt" type="text" name="alt" maxlength="300" required placeholder="Напр.: бронзовий меч із розкопок біля Києва">
<label for="credit">Автор або джерело фото</label><input id="credit" type="text" name="credit" maxlength="300" required placeholder="Напр.: фото Олени Коваль / прес-служба музею">
<label for="caption">Підпис під фото <small>(необов’язково)</small></label><input id="caption" type="text" name="caption" maxlength="500">
<label for="license">Дозвіл / ліцензія <small>(необов’язково)</small></label><input id="license" type="text" name="license" maxlength="300" placeholder="власне фото / з дозволу автора / CC BY 4.0">
<button type="submit">Завантажити</button></form>
<p class="muted" style="margin-top:16px">Посилання діє до ${esc(until)}. Нікому його не пересилайте.</p>`)
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const c = await context(req, token)
  if ('error' in c) return c.error
  const raw = await readBody(req, MAX_IMAGE_BYTES + 64 * 1024)
  if (!raw) return wantsJson(req) ? jsonReply({ error: 'too_large', hint: 'Фото до 20 МБ' }, 413) : page('<h1>Фото завелике</h1><p class="err">Потрібно до 20 МБ.</p><p><a href="">Назад</a></p>', 413)
  try {
    const form = await new Request(req.url, { method: 'POST', headers: req.headers, body: new Uint8Array(raw) }).formData()
    const file = form.get('file')
    if (!(file instanceof File) || !file.size) throw new UserError('missing_field', 'Виберіть фото', { field: 'file' })
    if (file.size > MAX_IMAGE_BYTES) throw new UserError('too_large', 'Фото більше за 20 МБ')
    const buf = Buffer.from(await file.arrayBuffer())
    // The link itself was issued only after confirm_published for a published article.
    const { live, media, width, height } = await setCover(
      c.payload,
      c.user,
      c.article.id,
      buf,
      {
        alt: String(form.get('alt') || ''),
        credit: String(form.get('credit') || ''),
        caption: String(form.get('caption') || '') || undefined,
        license: String(form.get('license') || '') || undefined,
      },
      true,
    )
    c.payload.logger.info({ connectorUser: c.user.email, action: 'cover-upload', article: c.article.id }, 'connector')
    if (wantsJson(req)) return jsonReply({ ok: true, id: c.article.id, media_id: media.id, size: `${width}×${height}`, live })
    return page(`<h1>Готово</h1><p class="ok">Фото стало обкладинкою матеріалу «${esc(c.article.title)}».${live ? ' Матеріал опублікований — фото вже на сайті.' : ''}</p><p class="muted">Можна закрити цю сторінку або завантажити інше фото <a href="">тут</a>.</p>`)
  } catch (e: any) {
    const msg = e instanceof UserError || /^(Фото|Це не фото|Підходять|Потрібні)/.test(String(e?.message)) ? e.message : 'Не вдалося зберегти фото. Спробуйте ще раз.'
    if (!(e instanceof UserError)) c.payload.logger.warn({ err: e, connectorUser: c.user.email }, 'connector upload failed')
    if (wantsJson(req)) return jsonReply({ error: e instanceof UserError ? e.code : 'image_error', hint: msg }, 400)
    return page(`<h1>Не вийшло</h1><p class="err">${esc(msg)}</p><p><a href="">Спробувати ще раз</a></p>`, 400)
  }
}
