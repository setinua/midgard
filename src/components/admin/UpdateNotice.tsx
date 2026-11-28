'use client'
import { useEffect, useState, type ReactNode } from 'react'

const CHECK_EVERY_MS = 60_000

async function currentVersion(): Promise<string | null> {
  try {
    const r = await fetch('/healthz', { cache: 'no-store' })
    if (!r.ok) return null
    return ((await r.json()) as { version?: string }).version || null
  } catch {
    return null
  }
}

/**
 * Admin provider: after the site is redeployed, an admin tab opened earlier keeps the old build and can stop
 * responding (old scripts, old server calls). Checks the deployment version every minute and on returning to
 * the tab; when it changes, shows a banner asking to reload. Never reloads by itself, so typing is not lost.
 */
export function UpdateNotice({ children }: { children?: ReactNode }) {
  const [outdated, setOutdated] = useState(false)

  useEffect(() => {
    let initial: string | null = null
    let stopped = false
    const check = async () => {
      if (stopped || document.visibilityState !== 'visible') return
      const v = await currentVersion()
      if (!v) return
      if (!initial) initial = v
      else if (v !== initial) setOutdated(true)
    }
    check()
    const timer = setInterval(check, CHECK_EVERY_MS)
    document.addEventListener('visibilitychange', check)
    return () => {
      stopped = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  return (
    <>
      {children}
      {outdated && (
        <div
          role="alert"
          style={{
            position: 'fixed', left: 16, right: 16, bottom: 16, zIndex: 10000, maxWidth: 560, margin: '0 auto',
            display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderRadius: 8, background: '#1f2933', color: '#fff',
            boxShadow: '0 6px 24px rgba(0,0,0,.25)', fontSize: 14, lineHeight: 1.4,
          }}
        >
          <span>Сайт оновлено. Щоб адмінка не зависла, оновіть сторінку (незбережене спершу збережіть).</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ flex: 'none', padding: '8px 14px', borderRadius: 6, border: 0, background: '#c9a227', color: '#1f2933', fontWeight: 600, cursor: 'pointer' }}
          >
            Оновити
          </button>
        </div>
      )}
    </>
  )
}
