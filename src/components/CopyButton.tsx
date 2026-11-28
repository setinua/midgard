'use client'
import { useState } from 'react'

/** Copies a text (a feed address) to the clipboard; shows «Скопійовано» for 2 s. */
export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className="rss-btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 2000)
        } catch {
          window.prompt('Скопіюйте адресу:', text)
        }
      }}
    >
      {done ? 'Скопійовано' : 'Копіювати'}
    </button>
  )
}
