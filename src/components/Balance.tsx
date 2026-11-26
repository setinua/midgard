'use client'
import { useEffect } from 'react'

// Top row of the homepage (wide screens): side columns are cut to the centre column's height.
// Items that would be cut in half are hidden, so every column ends on a whole item.
export function Balance() {
  useEffect(() => {
    const row = document.querySelector('.t1.balanced')
    if (!row) return
    const run = () => {
      row.querySelectorAll<HTMLElement>('.fill').forEach((f) => {
        const limit = f.getBoundingClientRect().bottom + 1
        f.querySelectorAll<HTMLElement>('li').forEach((li) => {
          li.style.visibility = li.getBoundingClientRect().bottom > limit ? 'hidden' : ''
        })
      })
    }
    run()
    const ro = new ResizeObserver(run)
    ro.observe(row)
    row.querySelectorAll('.c-lead').forEach((c) => ro.observe(c))
    window.addEventListener('load', run)
    document.fonts?.ready.then(run)
    return () => {
      ro.disconnect()
      window.removeEventListener('load', run)
    }
  }, [])
  return null
}
