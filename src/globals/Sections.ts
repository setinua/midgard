import type { Field, GlobalConfig } from 'payload'
import { isEditorOrAdmin } from '../access'
import { ARTICLE_TYPES } from '../lib/constants'

// Title and text above the list on section pages (/novyny, /publikatsii, …).
// Empty title — the default name from ARTICLE_TYPES is used.
const section = (t: (typeof ARTICLE_TYPES)[number]): Field => ({
  name: t.value,
  type: 'group',
  label: `${t.label} (/${t.path})`,
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Назва сторінки',
      admin: { placeholder: t.label, description: `Заголовок на сторінці, у «хлібних крихтах» і в назві вкладки. Якщо порожньо — «${t.label}». Пункт меню не змінюється.` },
    },
    {
      name: 'text',
      type: 'richText',
      label: 'Текст під заголовком',
      admin: { description: 'Показується під назвою, над фільтрами і списком матеріалів. Можна залишити порожнім.' },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      label: 'Опис для пошуковиків',
      admin: { description: 'До 160 символів. Якщо порожньо — пошуковик візьме текст зі сторінки сам.' },
    },
  ],
})

export const Sections: GlobalConfig = {
  slug: 'sections',
  label: 'Розділи (Новини, Публікації…)',
  admin: { group: 'Налаштування', description: 'Назва і текст угорі сторінок розділів.' },
  access: { read: () => true, update: isEditorOrAdmin },
  fields: ARTICLE_TYPES.map(section),
}
