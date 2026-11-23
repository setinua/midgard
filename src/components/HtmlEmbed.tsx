'use client'
import { useEffect, useRef } from 'react'

// Renders editor-supplied HTML and re-runs its <script> tags (needed for Instagram, X, etc. embeds).
export function HtmlEmbed({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = html
    el.querySelectorAll('script').forEach((old) => {
      const s = document.createElement('script')
      for (const a of Array.from(old.attributes)) s.setAttribute(a.name, a.value)
      s.text = old.text
      old.replaceWith(s)
    })
  }, [html])
  return <div ref={ref} className="embed" dangerouslySetInnerHTML={{ __html: html }} />
}
