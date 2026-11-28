import { LinkJSXConverter, RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { ReactNode } from 'react'
import { typeByValue } from '../lib/constants'
import { HtmlEmbed } from './HtmlEmbed'

const internal = ({ linkNode }: any) => {
  const doc = linkNode?.fields?.doc
  const v = doc?.value
  if (!v || typeof v !== 'object') return '#'
  if (doc.relationTo === 'articles') return `/${typeByValue(v.type)?.path}/${v.slug}`
  if (doc.relationTo === 'pages') return `/${v.slug}`
  return '#'
}

const SITE_HOST = (process.env.SERVER_URL || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '')
const hostOf = (url: string) => url.replace(/^https?:\/\//i, '').split(/[/?#:]/)[0].toLowerCase().replace(/^www\./, '')
const isExternal = (url: string) => /^https?:\/\//i.test(url) && hostOf(url) !== SITE_HOST.toLowerCase().replace(/^www\./, '')

// Partner (advertising) materials: every external link in the text is marked rel="sponsored" (Google's rule for paid links).
const sponsoredLinks = (): Partial<ReturnType<JSXConvertersFunction>> => {
  const render = ({ node, nodesToJSX }: any) => {
    const f = node.fields || {}
    const url: string = f.linkType === 'internal' ? internal({ linkNode: node }) : f.url || '#'
    const relAttr = [f.newTab ? 'noopener noreferrer' : '', isExternal(url) ? 'sponsored' : ''].filter(Boolean).join(' ') || undefined
    return (
      <a href={url} rel={relAttr} target={f.newTab ? '_blank' : undefined}>
        {nodesToJSX({ nodes: node.children })}
      </a>
    )
  }
  return { link: render, autolink: render }
}

const make = (sponsored: boolean): JSXConvertersFunction => ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref: internal }),
  ...(sponsored ? sponsoredLinks() : {}),
  blocks: {
    html: ({ node }: any) => (node.fields?.html ? <HtmlEmbed html={node.fields.html} /> : null),
  },
  upload: ({ node }: any) => {
    const m = node.value
    if (!m || typeof m !== 'object' || !m.url) return null
    const src = m.sizes?.lead?.url || m.url
    return (
      <figure style={{ margin: '24px 0' }}>
        <img src={src} alt={m.alt || ''} loading="lazy" width={m.sizes?.lead?.width || m.width} height={m.sizes?.lead?.height || m.height} />
        {(m.caption || m.credit) && <figcaption>{[m.caption, m.credit && `Фото: ${m.credit}`].filter(Boolean).join('. ')}</figcaption>}
      </figure>
    )
  },
})

const plain = make(false)
const partner = make(true)

/** Top-level text paragraphs (not empty ones) — banner 2 goes after the 3rd, only when there are 6 or more. */
const MID_AFTER = 3
const MID_MIN = 6
const isPara = (n: any) => n?.type === 'paragraph' && Array.isArray(n.children) && n.children.length > 0

export function Prose({ data, sponsored = false, middle }: { data: unknown; sponsored?: boolean; middle?: ReactNode }) {
  if (!data) return null
  const converters = sponsored ? partner : plain
  const state = data as SerializedEditorState
  const nodes = (state.root?.children || []) as any[]
  if (middle && nodes.filter(isPara).length >= MID_MIN) {
    let seen = 0
    const cut = nodes.findIndex((n) => isPara(n) && ++seen === MID_AFTER) + 1
    const part = (children: any[]) => ({ ...state, root: { ...state.root, children } }) as SerializedEditorState
    return (
      <>
        <RichText data={part(nodes.slice(0, cut))} converters={converters} className="prose" />
        {middle}
        <RichText data={part(nodes.slice(cut))} converters={converters} className="prose" />
      </>
    )
  }
  return <RichText data={state} converters={converters} className="prose" />
}
