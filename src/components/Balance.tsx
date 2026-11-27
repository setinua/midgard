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
        f.classList.add('loose') // measure packed
        let last: HTMLElement | null = null
        for (let i = items.length - 1; i >= 0; i--) {
          if (items[i].offsetParent === null) continue // x-extra hidden on narrow screens
          if (i === 0 || items[i].getBoundingClientRect().bottom <= limit) { last = items[i]; break }
          items[i].style.display = 'none'
        }
        // Too few materials to fill the column: keep them packed at the top instead of spreading wide gaps.
        if (!last || limit - last.getBoundingClientRect().bottom <= 140) f.classList.remove('loose')
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
