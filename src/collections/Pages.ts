import type { CollectionConfig } from 'payload'
import { isEditorOrAdmin } from '../access'
import { seoFields, slugField } from './fields'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Сторінка', plural: 'Сторінки' },
  admin: { useAsTitle: 'title', group: 'Контент', defaultColumns: ['title', 'slug'] },
  access: { read: () => true, create: isEditorOrAdmin, update: isEditorOrAdmin, delete: isEditorOrAdmin },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Заголовок' },
    slugField('title'),
    { name: 'intro', type: 'textarea', label: 'Вступ' },
    { name: 'content', type: 'richText', label: 'Текст' },
    seoFields,
  ],
}
