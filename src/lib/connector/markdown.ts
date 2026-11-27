// Markdown ⇄ Lexical for the Claude connector.
// Only a safe subset is accepted from the connector: paragraphs, ## / ### / #### headings,
// bullet and numbered lists, quotes, **bold**, *italic* and http(s) links.
// Raw HTML is never turned into an HTML block: it stays plain text.
// Photos and HTML blocks already in an article are shown as {{блок:N}} and can only be
// kept or removed, never created from text.

const base = { direction: 'ltr', format: '', indent: 0, version: 1 }
const textNode = (text: string, format = 0) => ({ type: 'text', version: 1, text, format, style: '', mode: 'normal', detail: 0 })

const SAFE_URL = /^https?:\/\/[^\s<>"']+$/i
export const isSafeUrl = (u: string) => SAFE_URL.test(u) && u.length <= 2000

// Inline: **bold**, *italic* / _italic_, [text](https://…)
function inline(src: string): any[] {
  const out: any[] = []
  const re = /\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|_([^_\s][^_]*)_|\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(textNode(src.slice(last, m.index)))
    if (m[1] !== undefined) out.push(textNode(m[1], 1))
    else if (m[2] !== undefined) out.push(textNode(m[2], 2))
    else if (m[3] !== undefined) out.push(textNode(m[3], 2))
    else if (m[4] !== undefined) {
      const url = m[5]
      if (isSafeUrl(url)) {
        out.push({ ...base, type: 'link', version: 3, fields: { linkType: 'custom', url, newTab: true }, children: [textNode(m[4])] })
      } else out.push(textNode(m[0]))
    }
    last = re.lastIndex
  }
  if (last < src.length) out.push(textNode(src.slice(last)))
  return out.filter((n) => n.type !== 'text' || n.text !== '')
}

const para = (t: string) => ({ ...base, type: 'paragraph', textFormat: 0, children: inline(t) })

/** `keep` — nodes of the current article content, addressable as {{блок:N}}. */
export function markdownToLexical(md: string, keep: any[] = []): any {
  const lines = md.replace(/\r\n?/g, '\n').split('\n')
  const children: any[] = []
  let buf: string[] = []
  let list: any = null
  const flushPara = () => {
    if (buf.length) children.push(para(buf.join(' ').trim()))
    buf = []
  }
  const flushList = () => {
    if (list) children.push(list)
    list = null
  }
  for (const raw of lines) {
    const line = raw.trimEnd()
    const t = line.trim()
    let m: RegExpMatchArray | null
    if (!t) {
      flushPara()
      flushList()
      continue
    }
    if ((m = t.match(/^\{\{блок:(\d+)\}\}$/))) {
      flushPara()
      flushList()
      const node = keep[Number(m[1])]
      if (node) children.push(node)
      continue
    }
    if ((m = t.match(/^(#{1,4})\s+(.+)$/))) {
      flushPara()
      flushList()
      const level = Math.max(2, m[1].length)
      children.push({ ...base, type: 'heading', tag: `h${level}`, children: inline(m[2].trim()) })
      continue
    }
    if ((m = t.match(/^>\s?(.*)$/))) {
      flushPara()
      flushList()
      children.push({ ...base, type: 'quote', children: inline(m[1]) })
      continue
    }
    const bullet = t.match(/^[-*•]\s+(.+)$/)
    const num = t.match(/^(\d+)[.)]\s+(.+)$/)
    if (bullet || num) {
      flushPara()
      const listType = bullet ? 'bullet' : 'number'
      if (!list || list.listType !== listType) {
        flushList()
        list = { ...base, type: 'list', listType, tag: bullet ? 'ul' : 'ol', start: 1, children: [] }
      }
      list.children.push({ ...base, type: 'listitem', value: list.children.length + 1, checked: undefined, children: inline((bullet ? bullet[1] : num![2]).trim()) })
      continue
    }
    flushList()
    buf.push(t)
  }
  flushPara()
  flushList()
  return { root: { ...base, type: 'root', children } }
}

function inlineToMd(nodes: any[] = []): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') {
        const t = String(n.text || '')
        if (n.format & 1) return `**${t}**`
        if (n.format & 2) return `*${t}*`
        return t
      }
      if (n.type === 'link' || n.type === 'autolink') return `[${inlineToMd(n.children)}](${n.fields?.url || n.url || ''})`
      if (n.type === 'linebreak') return ' '
      return inlineToMd(n.children)
    })
    .join('')
}

/** Returns markdown and the top-level nodes it cannot express (photos, HTML blocks), numbered as {{блок:N}}. */
export function lexicalToMarkdown(value: any): { markdown: string; keep: any[] } {
  const keep: any[] = []
  const parts: string[] = []
  for (const n of value?.root?.children || []) {
    if (n.type === 'paragraph') parts.push(inlineToMd(n.children))
    else if (n.type === 'heading') parts.push(`${'#'.repeat(Number(String(n.tag).slice(1)) || 2)} ${inlineToMd(n.children)}`)
    else if (n.type === 'quote') parts.push(`> ${inlineToMd(n.children)}`)
    else if (n.type === 'list') {
      parts.push((n.children || []).map((li: any, i: number) => `${n.listType === 'number' ? `${i + 1}.` : '-'} ${inlineToMd(li.children)}`).join('\n'))
    } else {
      keep.push(n)
      parts.push(`{{блок:${keep.length - 1}}}`)
    }
  }
  return { markdown: parts.filter((p) => p !== '').join('\n\n'), keep }
}
