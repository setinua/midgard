'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window { adsbygoogle?: unknown[] }
}

/** Network snippets must run their <script> tags, which React's innerHTML never does. */
export function AdCode({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = ''
    el.appendChild(document.createRange().createContextualFragment(code))
    return () => {
      el.innerHTML = ''
    }
  }, [code])
  return <div ref={ref} className="adslot__fill" />
}

/**
 * One AdSense display unit. It fills the reserved box (width and height come from CSS), so the page never jumps.
 * Each unit is pushed once; on client-side navigation a new page mounts new units.
 */
export function AdsenseUnit({ client, slot }: { client: string; slot: string }) {
  const ref = useRef<HTMLModElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || el.dataset.adsbygoogleStatus) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {}
  }, [slot])
  return (
    <ins
      ref={ref}
      className="adsbygoogle adslot__fill"
      style={{ display: 'block' }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-full-width-responsive="false"
    />
  )
}
