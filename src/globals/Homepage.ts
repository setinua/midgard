import type { Field, GlobalConfig } from 'payload'
import { isEditorOrAdmin } from '../access'

const pick = (name: string, label: string, max: number, type?: string): Field => ({
  name,
  type: 'relationship' as const,
  relationTo: 'articles' as const,
  hasMany: true as const,
  maxRows: max,
  label,
  filterOptions: type ? { type: { equals: type } } : undefined,
  admin: { description: `До ${max}. Якщо порожньо — показуються останні матеріали цього типу.` },
})

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Головна сторінка',
  admin: { group: 'Головна' },
  access: { read: () => true, update: isEditorOrAdmin },
  fields: [
    { name: 'textOfDay', type: 'relationship', relationTo: 'articles', label: 'Текст дня' },
    {
      name: 'mainToday',
      type: 'relationship',
      relationTo: 'articles',
      hasMany: true,
      maxRows: 15,
      label: 'Головне сьогодні (10–15, перетягуйте для порядку)',
    },
    { name: 'newsCount', type: 'number', min: 10, max: 15, defaultValue: 12, label: 'Скільки позицій в «Останніх новинах»' },
    pick('pinnedPublications', 'Закріплені публікації', 5, 'publication'),
    pick('pinnedColumns', 'Закріплені колонки', 5, 'column'),
    pick('pinnedSpecials', 'Закріплені спецпроєкти', 5, 'special'),
    {
      name: 'popular',
      type: 'relationship',
      relationTo: 'articles',
      hasMany: true,
      maxRows: 5,
      label: '«Популярні» (ручний добір, до 5)',
      admin: { description: 'Поки немає даних аналітики, «Популярні» добираються вручну. Порожньо — блок не показується.' },
    },
  ],
}
