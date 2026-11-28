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
    { name: 'gaId', type: 'text', label: 'Google Analytics 4 ID (G-…)', admin: { description: 'Google Analytics → Адміністрування → Потоки даних → midgard.news → «Ідентифікатор потоку» (G-…). Порожньо — аналітики немає.' } },
    {
      name: 'googleVerification',
      type: 'textarea',
      label: 'Підтвердження Google (Search Console)',
      admin: {
        rows: 2,
        description: 'Search Console → Додати ресурс → «Префікс URL» https://midgard.news → спосіб «Тег HTML»: вставте тег <meta …> повністю або лише значення content. Кілька кодів — кожен з нового рядка. Після підтвердження не видаляйте, інакше доступ до Search Console злетить.',
      },
    },
    {
      name: 'bingVerification',
      type: 'textarea',
      label: 'Підтвердження Bing (Webmaster Tools)',
      admin: {
        rows: 2,
        description: 'Bing Webmaster Tools → спосіб «HTML Meta Tag» (msvalidate.01): вставте тег повністю або лише значення content. Можна також просто імпортувати сайт із Google Search Console — тоді код не потрібен.',
      },
    },
    { name: 'editorialEmail', type: 'email', label: 'Пошта редакції' },
    { name: 'copyright', type: 'text', label: 'Рядок ©', defaultValue: 'Використання матеріалів — з посиланням на джерело.' },
  ],
}
