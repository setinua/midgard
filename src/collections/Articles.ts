import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { ownOrEditor, publishedOrStaff, isLoggedIn, isEditorOrAdmin } from '../access'
import { ARTICLE_TYPES, typeByValue } from '../lib/constants'
import { lexicalToText } from '../lib/lexical'
import { seoFields, slugField } from './fields'

const isType = (t: string) => (_: unknown, sibling: any) => sibling?.type === t

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: 'Матеріал', plural: 'Матеріали' },
  admin: {
    useAsTitle: 'title',
    group: 'Контент',
    defaultColumns: ['title', 'type', 'primaryRegion', 'publishedAt', '_status'],
    listSearchableFields: ['title', 'lead'],
    // «Переглянути»: opens the article on the site (latest saved version, drafts included, for logged-in users).
    preview: (doc) => {
      const t = typeByValue(String(doc?.type || ''))
      if (!t || !doc?.slug) return null
      const site = (process.env.SERVER_URL || '').replace(/\/$/, '')
      return `${site}/pereglyad?path=${encodeURIComponent(`/${t.path}/${doc.slug}`)}`
    },
  },
  defaultSort: '-publishedAt',
  access: { read: publishedOrStaff, create: isLoggedIn, update: ownOrEditor, delete: isEditorOrAdmin },
  versions: { drafts: { autosave: { interval: 2000 }, schedulePublish: true }, maxPerDoc: 50 },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Заголовок (H1)' },
    { name: 'lead', type: 'textarea', required: true, label: 'Підзаголовок / анотація' },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Текст',
          fields: [
            { name: 'hero', type: 'upload', relationTo: 'media', label: 'Головне фото (від 1200 px завширшки)' },
            { name: 'content', type: 'richText', label: 'Текст' },
            {
              name: 'sources',
              type: 'array',
              label: 'Джерела', labels: { singular: 'джерело', plural: 'Джерела' },
              admin: { description: 'Обов’язково для новин.' },
              fields: [
                { name: 'title', type: 'text', required: true, label: 'Назва джерела' },
                { name: 'url', type: 'text', label: 'Посилання' },
              ],
            },
          ],
        },
        {
          label: 'Рубрики і зв’язки',
          fields: [
            { name: 'primaryRegion', type: 'relationship', relationTo: 'regions', required: true, label: 'Основний регіон' },
            { name: 'regions', type: 'relationship', relationTo: 'regions', hasMany: true, label: 'Додаткові регіони' },
            { name: 'primaryEpoch', type: 'relationship', relationTo: 'epochs', required: true, label: 'Основна епоха' },
            { name: 'epochs', type: 'relationship', relationTo: 'epochs', hasMany: true, label: 'Додаткові епохи' },
            { name: 'tags', type: 'relationship', relationTo: 'tags', hasMany: true, label: 'Теги' },
            {
              name: 'related',
              type: 'relationship',
              relationTo: 'articles',
              hasMany: true,
              maxRows: 4,
              label: '«Читайте також» (вручну, до 4)',
              filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
              admin: { description: 'Ручний вибір показується першим. Решту місць (до 4) сайт добирає сам: спершу та сама епоха, потім той самий регіон, потім найновіші.' },
            },
          ],
        },
        {
          label: 'Інтерв’ю / партнер',
          fields: [
            {
              name: 'interviewee',
              type: 'group',
              label: 'Співрозмовник',
              admin: { condition: isType('interview') },
              fields: [
                { name: 'name', type: 'text', label: 'Ім’я' },
                { name: 'title', type: 'text', label: 'Посада / науковий ступінь' },
                { name: 'photo', type: 'upload', relationTo: 'media', label: 'Фото' },
              ],
            },
            { name: 'sponsor', type: 'text', label: 'Замовник (партнер)', admin: { condition: isType('partner') } },
          ],
        },
      ],
    },
    slugField('title'),
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'news',
      label: 'Тип матеріалу',
      index: true,
      options: ARTICLE_TYPES.map((t) => ({ label: t.single, value: t.value })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      index: true,
      label: 'Дата публікації',
      defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' } },
    },
    {
      name: 'contentUpdatedAt',
      type: 'date',
      label: 'Суттєво оновлено',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' } },
    },
    { name: 'authors', type: 'relationship', relationTo: 'authors', hasMany: true, label: 'Автори', admin: { position: 'sidebar' } },
    { name: 'byline', type: 'text', label: 'Підпис без автора', defaultValue: 'Редакція', admin: { position: 'sidebar', description: 'Показується, якщо автора не вказано.' } },
    seoFields,
    { name: 'createdBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true, position: 'sidebar' }, access: { update: () => false } },
    { name: 'searchText', type: 'textarea', admin: { hidden: true } },
  ],
  hooks: {
    beforeChange: [
      ({ data, req, operation, originalDoc, context }) => {
        const user: any = req.user
        if (operation === 'create' && user) {
          data.createdBy = user.id
          if ((!data.authors || data.authors.length === 0) && user.author) data.authors = [typeof user.author === 'object' ? user.author.id : user.author]
        }
        // Exception: the Claude connector saving the journalist's own already-published article (stays published).
        const connectorLiveEdit = context?.connectorLiveEdit === true && operation === 'update' && originalDoc?._status === 'published'
        if (user?.role === 'author' && data._status === 'published' && !connectorLiveEdit) {
          throw new APIError('Автор не може публікувати. Збережіть чернетку — опублікує редактор.', 403)
        }
        data.searchText = [data.title, data.lead, lexicalToText(data.content)].filter(Boolean).join('\n').slice(0, 20000)
        return data
      },
    ],
  },
}
