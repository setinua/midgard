import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Налаштування сайту',
  admin: { group: 'Налаштування' },
  access: { read: () => true, update: isAdmin },
  fields: [
    { name: 'description', type: 'textarea', label: 'Опис сайту (для пошуковиків і футера)', defaultValue: 'Археологічне медіа про загублений світ людей.' },
    {
      name: 'social',
      type: 'array',
      label: 'Соцмережі', labels: { singular: 'соцмережу', plural: 'Соцмережі' },
      fields: [
        { name: 'network', type: 'select', required: true, options: ['facebook', 'telegram', 'youtube', 'instagram', 'x'], label: 'Мережа' },
        { name: 'url', type: 'text', required: true, label: 'Посилання' },
      ],
    },
    { name: 'gaId', type: 'text', label: 'Google Analytics 4 ID (G-…)' },
    { name: 'editorialEmail', type: 'email', label: 'Пошта редакції' },
    { name: 'copyright', type: 'text', label: 'Рядок ©', defaultValue: 'Використання матеріалів — з посиланням на джерело.' },
  ],
}
