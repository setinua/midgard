import type { CollectionConfig } from 'payload'
import { isAdmin, isEditorOrAdmin } from '../access'
import { orderField, seoFields, slugField } from './fields'

const base = (slug: string, singular: string, plural: string, extra: any[] = [], editor = false): CollectionConfig => ({
  slug,
  labels: { singular, plural },
  admin: { useAsTitle: 'name', group: 'Рубрики', defaultColumns: ['name', 'slug', 'order'] },
  defaultSort: 'order',
  access: { read: () => true, create: editor ? isEditorOrAdmin : isAdmin, update: editor ? isEditorOrAdmin : isAdmin, delete: isAdmin },
  fields: [{ name: 'name', type: 'text', required: true, label: 'Назва' }, slugField('name'), orderField, ...extra, seoFields],
})

export const Regions = base('regions', 'Регіон', 'Регіони світу', [
  { name: 'description', type: 'textarea', label: 'Опис' },
])

export const Epochs = base('epochs', 'Епоха', 'Епохи', [
  { name: 'period', type: 'text', label: 'Хронологічні межі' },
  { name: 'description', type: 'textarea', label: 'Опис' },
])

export const Tags = base('tags', 'Тег', 'Теги', [], true)
