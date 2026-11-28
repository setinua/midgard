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
    {
      name: 'title',
      type: 'text',
      label: 'SEO-заголовок (title)',
      admin: {
        description: 'Для Google: до 60 символів, головне слово на початку («де + що знайшли + епоха»). Порожньо — береться заголовок; « | Мідгард» додається, коли влазить.',
        components: { afterInput: [{ path: '/components/admin/CharCount#CharCount', clientProps: { max: 60 } }] },
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'SEO-опис (description)',
      admin: {
        description: 'Закінчене речення 120–155 символів: хто, що, де, коли. Порожньо — береться анотація, обрізана по реченню.',
        components: { afterInput: [{ path: '/components/admin/CharCount#CharCount', clientProps: { min: 120, max: 155 } }] },
      },
    },
  ],
}

export const orderField: Field = {
  name: 'order',
  type: 'number',
  label: 'Порядок',
  defaultValue: 0,
  admin: { position: 'sidebar' },
}
