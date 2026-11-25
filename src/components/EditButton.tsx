'use client'
import { useEffect, useState } from 'react'

// Floating «edit in admin» button on article pages. Rendered only for a logged-in Payload user:
// the login cookie is HttpOnly, so we ask /api/users/me (same origin sends it automatically).
export function EditButton({ id }: { id: number | string }) {
  const [canEdit, setCanEdit] = useState(false)
  useEffect(() => {
    fetch('/api/users/me', { credentials: 'same-origin', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCanEdit(Boolean(d?.user)))
      .catch(() => setCanEdit(false))
  }, [])
  if (!canEdit) return null
  return (
    <a className="edit-fab" href={`/admin/collections/articles/${id}`} target="_blank" rel="noopener" aria-label="Редагувати в адмінці" title="Редагувати">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
      </svg>
    </a>
  )
}
