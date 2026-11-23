import type { CollectionConfig } from 'payload'
import { adminFieldOnly, isAdmin, isLoggedIn } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Користувач', plural: 'Користувачі' },
  admin: { useAsTitle: 'email', group: 'Налаштування', defaultColumns: ['email', 'name', 'role'] },
  hooks: {
    // The very first account (created on /admin/create-first-user) is always an administrator.
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users', req })
          if (totalDocs === 0) data.role = 'admin'
        }
        return data
      },
    ],
  },
  auth: { maxLoginAttempts: 5, lockTime: 15 * 60 * 1000 },
  access: {
    read: isLoggedIn,
    create: isAdmin,
    delete: isAdmin,
    update: ({ req }) => (req.user?.role === 'admin' ? true : { id: { equals: req.user?.id } }),
  },
  fields: [
    { name: 'name', type: 'text', label: 'Ім’я' },
    {
      name: 'role',
      type: 'select',
      label: 'Роль',
      required: true,
      defaultValue: 'author',
      saveToJWT: true,
      access: { update: adminFieldOnly, create: adminFieldOnly },
      options: [
        { label: 'Адміністратор', value: 'admin' },
        { label: 'Редактор', value: 'editor' },
        { label: 'Автор', value: 'author' },
      ],
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      label: 'Профіль автора на сайті',
      admin: { description: 'Щоб нові матеріали автоматично підписувались цим автором.' },
    },
  ],
}
