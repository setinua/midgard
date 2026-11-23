import type { Access, FieldAccess } from 'payload'

export type Role = 'admin' | 'editor' | 'author'
const role = (user: any): Role | undefined => user?.role

export const isAdmin: Access = ({ req }) => role(req.user) === 'admin'
export const isEditorOrAdmin: Access = ({ req }) => ['admin', 'editor'].includes(role(req.user) || '')
export const isLoggedIn: Access = ({ req }) => Boolean(req.user)
export const adminFieldOnly: FieldAccess = ({ req }) => role(req.user) === 'admin'

// Published content is public; drafts only for logged-in staff.
export const publishedOrStaff: Access = ({ req }) => (req.user ? true : { _status: { equals: 'published' } })

// Authors may edit only what they created; editors and admins edit everything.
export const ownOrEditor: Access = ({ req }) => {
  const r = role(req.user)
  if (r === 'admin' || r === 'editor') return true
  if (r === 'author') return { createdBy: { equals: req.user!.id } }
  return false
}
