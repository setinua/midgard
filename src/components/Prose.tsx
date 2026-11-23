import { LinkJSXConverter, RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
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

const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref: internal }),
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

export function Prose({ data }: { data: unknown }) {
  if (!data) return null
  return <RichText data={data as SerializedEditorState} converters={converters} className="prose" />
}
