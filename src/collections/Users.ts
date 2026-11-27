import type { CollectionConfig } from 'payload'
import { adminFieldOnly, isAdmin, isLoggedIn } from '../access'
import { connectorUrl, hashToken, newConnectorToken } from '../lib/connector/security'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Користувач', plural: 'Користувачі' },
  admin: { useAsTitle: 'email', group: 'Налаштування', defaultColumns: ['email', 'name', 'role'] },
  hooks: {
    // The very first account (created on /admin/create-first-user) is always an administrator.
    beforeChange: [
      async ({ data, operation, req, originalDoc }) => {
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users', req })
          if (totalDocs === 0) data.role = 'admin'
        }
        // Claude connector: a new secret link when the admin asks for one (or turns it on the first time).
        // Field access keeps these values admin-only, so other users cannot set them.
        const first = data.connectorEnabled && !data.connectorTokenHash && !originalDoc?.connectorTokenHash
        if (data.connectorRegenerate || first) {
          const token = newConnectorToken()
          data.connectorTokenHash = hashToken(token)
          data.connectorUrl = connectorUrl(token)
        }
        data.connectorRegenerate = false
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
    {
      type: 'collapsible',
      label: 'Конектор Claude (журналіст)',
      admin: { initCollapsed: true, condition: (_, __, { user }) => (user as any)?.role === 'admin' },
      fields: [
        {
          name: 'connectorEnabled',
          type: 'checkbox',
          label: 'Дозволити додавати матеріали через Claude',
          defaultValue: false,
          access: { read: adminFieldOnly, create: adminFieldOnly, update: adminFieldOnly },
          admin: { description: 'Вимкнення одразу зупиняє посилання. Права — як у ролі користувача, але лише власні матеріали; нові завжди чернетками. Для журналіста ставте роль «Автор».' },
        },
        {
          name: 'connectorRegenerate',
          type: 'checkbox',
          label: 'Створити нове посилання (старе перестане діяти)',
          defaultValue: false,
          access: { read: adminFieldOnly, create: adminFieldOnly, update: adminFieldOnly },
        },
        {
          name: 'connectorUrl',
          type: 'text',
          label: 'Посилання для Claude (секретне — передавати лише цьому журналісту)',
          access: { read: adminFieldOnly, create: adminFieldOnly, update: adminFieldOnly },
          admin: { readOnly: true, description: 'З’явиться після збереження. Журналіст вставляє його в Claude: Customize → Connectors → Add custom connector.' },
        },
        {
          name: 'connectorTokenHash',
          type: 'text',
          index: true,
          access: { read: () => false, create: adminFieldOnly, update: adminFieldOnly },
          admin: { hidden: true },
        },
      ],
    },
  ],
}
