import type { CollectionConfig } from 'payload'
import { isEditorOrAdmin, isLoggedIn } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Файл', plural: 'Медіатека' },
  admin: { group: 'Контент', defaultColumns: ['filename', 'alt', 'credit'] },
  access: { read: () => true, create: isLoggedIn, update: isLoggedIn, delete: isEditorOrAdmin },
  upload: {
    mimeTypes: ['image/*'],
    focalPoint: true,
    formatOptions: { format: 'webp', options: { quality: 82 } },
    imageSizes: [
      { name: 'thumb', width: 240, height: 160, formatOptions: { format: 'webp', options: { quality: 78 } } },
      { name: 'card', width: 640, height: 427, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'lead', width: 1280, height: 800, formatOptions: { format: 'webp', options: { quality: 82 } } },
      { name: 'og', width: 1200, height: 630, formatOptions: { format: 'jpeg', options: { quality: 82 } } },
    ],
    adminThumbnail: 'thumb',
  },
  fields: [
    { name: 'alt', type: 'text', required: true, label: 'Альтернативний текст (що зображено)' },
    { name: 'caption', type: 'text', label: 'Підпис' },
    { name: 'credit', type: 'text', required: true, label: 'Автор / джерело' },
    { name: 'license', type: 'text', required: true, label: 'Ліцензія', admin: { description: 'Напр.: CC BY 4.0, власне фото, з дозволу автора.' } },
  ],
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        // Warn editors when a photo is too narrow for Google Discover.
        if (operation === 'create' && data?.width && data.width < 1200) {
          req.payload.logger.warn(`Media ${data.filename}: width ${data.width}px < 1200px`)
        }
        return data
      },
    ],
  },
}
