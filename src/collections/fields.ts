import type { Field } from 'payload'
import { slugify } from '../lib/slug'

// Slug filled from a source field when empty; editable by hand.
export const slugField = (from = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  label: 'Адреса (slug)',
  admin: { position: 'sidebar', description: 'Латиницею. Заповнюється із заголовка, можна змінити.' },
  hooks: {
    beforeValidate: [({ value, data }) => (value ? slugify(String(value)) : data?.[from] ? slugify(String(data[from])) : value)],
  },
})

export const seoFields: Field = {
  name: 'seo',
  type: 'group',
  label: 'SEO',
  admin: { position: 'sidebar' },
  fields: [
    { name: 'title', type: 'text', label: 'Title (якщо відрізняється від заголовка)' },
    { name: 'description', type: 'textarea', label: 'Description (якщо порожньо — береться анотація)' },
  ],
}

export const orderField: Field = {
  name: 'order',
  type: 'number',
  label: 'Порядок',
  defaultValue: 0,
  admin: { position: 'sidebar' },
}
