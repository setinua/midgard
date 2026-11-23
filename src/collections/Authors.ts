import type { CollectionConfig } from 'payload'
import { isEditorOrAdmin } from '../access'
import { orderField, seoFields, slugField } from './fields'

export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: { singular: 'Автор', plural: 'Автори' },
  admin: { useAsTitle: 'name', group: 'Контент', defaultColumns: ['name', 'expertise', 'inTeam'] },
  defaultSort: 'order',
  access: { read: () => true, create: isEditorOrAdmin, update: isEditorOrAdmin, delete: isEditorOrAdmin },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Ім’я та прізвище' },
    slugField('name'),
    orderField,
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Фото' },
    { name: 'expertise', type: 'text', label: 'Фах / науковий ступінь / посада' },
    { name: 'bio', type: 'textarea', label: 'Біографія' },
    {
      name: 'links',
      type: 'array',
      label: 'Профілі та соцмережі',
      fields: [
        { name: 'label', type: 'text', required: true, label: 'Назва' },
        { name: 'url', type: 'text', required: true, label: 'Посилання' },
      ],
    },
    { name: 'inTeam', type: 'checkbox', label: 'Показувати на сторінці «Команда»', defaultValue: true, admin: { position: 'sidebar' } },
    seoFields,
  ],
}
