'use client'
import { useEffect } from 'react'

// Top row of the homepage (wide screens): side columns are cut to the centre column's height.
// Items that would be cut in half are removed; CSS spreads the leftover space so every column ends on the line.
export function Balance() {
  useEffect(() => {
    const row = document.querySelector('.t1.balanced')
    if (!row) return
    const run = () => {
      row.querySelectorAll<HTMLElement>('.fill').forEach((f) => {
        // Show everything, then drop items from the end until the last one fits whole.
        const items = [...f.querySelectorAll<HTMLElement>('li')]
        items.forEach((li) => (li.style.display = ''))
        const limit = f.getBoundingClientRect().bottom + 1
        for (let i = items.length - 1; i > 0; i--) {
          if (items[i].offsetParent === null) continue // x-extra hidden on narrow screens
          if (items[i].getBoundingClientRect().bottom <= limit) break
          items[i].style.display = 'none'
        }
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
