import type { Field, GlobalConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * Three banner places, the same on every page that carries ads (home, articles, section/epoch/region/tag/author/archive
 * lists). Never on search, static pages (contacts, policies, «Реклама на сайті»), 404, or inside partner materials.
 * The size is reserved only while a banner is switched on, so a loading ad never moves the page. See docs/ADS.md.
 */
export const AD_SLOTS = {
  top: { label: 'Банер 1 · Верх', desktop: [970, 90], mobile: [320, 100] },
  middle: { label: 'Банер 2 · Середина', desktop: [300, 250], mobile: [300, 250] },
  bottom: { label: 'Банер 3 · Низ', desktop: [728, 90], mobile: [300, 250] },
} as const

export type AdSlotId = keyof typeof AD_SLOTS

const WHERE: Record<AdSlotId, string> = {
  top: 'Головна — під першим рядом (не на першому екрані телефона). Матеріал — під заголовком, лідом і автором. Списки (розділ, епоха, регіон, тег, автор, архів) — під заголовком.',
  middle: 'Матеріал — у тексті після 3-го абзацу (лише якщо абзаців 6+). Списки — після 6-го матеріалу. Головна — під «Публікаціями / Інтерв’ю / Спецпроєктами».',
  bottom: 'Одразу після тексту матеріалу і джерел (перед тегами й «Читайте також»); у списках і на головній — унизу.',
}

const size = (s: AdSlotId) => `Комп’ютер ${AD_SLOTS[s].desktop.join('×')}, телефон ${AD_SLOTS[s].mobile.join('×')}.`

const bannerGroup = (slot: AdSlotId): Field => ({
  name: slot,
  type: 'group',
  label: AD_SLOTS[slot].label,
  admin: { description: `${WHERE[slot]} ${size(slot)}` },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'active', type: 'checkbox', label: 'Показувати', defaultValue: false, admin: { width: '25%' } },
        { name: 'advertiser', type: 'text', label: 'Рекламодавець / мережа', admin: { width: '75%' } },
      ],
    },
    {
      name: 'kind',
      type: 'radio',
      label: 'Тип',
      defaultValue: 'adsense',
      options: [
        { label: 'Блок Google AdSense (лише ID блоку)', value: 'adsense' },
        { label: 'Код іншої мережі', value: 'code' },
        { label: 'Картинка + посилання (прямий продаж)', value: 'image' },
      ],
    },
    {
      name: 'adSlot',
      type: 'text',
      label: 'ID блоку AdSense (data-ad-slot)',
      admin: {
        condition: (_, s) => (s?.kind || 'adsense') === 'adsense',
        description: 'AdSense → Реклама → За рекламним блоком → «Медійний» блок (адаптивний) → у коді блоку число з data-ad-slot, напр. 1234567890.',
      },
      validate: (v: unknown) => !v || /^\d{6,}$/.test(String(v).trim()) || 'Лише цифри з data-ad-slot',
    },
    {
      name: 'code',
      type: 'code',
      label: 'Код банера',
      admin: { language: 'html', condition: (_, s) => s?.kind === 'code', description: 'Код блоку так, як його дає мережа.' },
    },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Картинка (комп’ютер)', admin: { condition: (_, s) => s?.kind === 'image' } },
    { name: 'mobileImage', type: 'upload', relationTo: 'media', label: 'Картинка (телефон, необов’язково)', admin: { condition: (_, s) => s?.kind === 'image' } },
    { name: 'url', type: 'text', label: 'Посилання', admin: { condition: (_, s) => s?.kind === 'image' } },
    { name: 'alt', type: 'text', label: 'Alt-текст', admin: { condition: (_, s) => s?.kind === 'image' } },
    {
      type: 'row',
      fields: [
        { name: 'startsAt', type: 'date', label: 'Показувати з', admin: { width: '50%' } },
        { name: 'endsAt', type: 'date', label: 'Показувати до', admin: { width: '50%' } },
      ],
    },
  ],
})

export const Ads: GlobalConfig = {
  slug: 'ads',
  label: 'Банери',
  admin: {
    group: 'Налаштування',
    description:
      'Три банерні місця, однакові на всіх сторінках з рекламою (головна, матеріали, списки). Немає реклами в пошуку, на сторінках сайту (контакти, політики), у партнерських матеріалах. Вимкнене місце нічого не показує й не займає місця. Над кожним банером — позначка «Реклама».',
  },
  access: { read: () => true, update: isAdmin },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Реклама на сайті увімкнена',
          defaultValue: true,
          admin: { width: '40%', description: 'Головний вимикач: вимкнено — жодних банерів і скрипта AdSense.' },
        },
        {
          name: 'adsenseClient',
          type: 'text',
          label: 'Видавець AdSense',
          defaultValue: 'ca-pub-6934929927682255',
          admin: { width: '60%', description: 'ca-pub-… — той самий, що в ads.txt. Скрипт AdSense вантажиться лише на сторінках з рекламою.' },
          validate: (v: unknown) => !v || /^ca-pub-\d{10,}$/.test(String(v).trim()) || 'Формат: ca-pub-1234567890123456',
        },
      ],
    },
    bannerGroup('top'),
    bannerGroup('middle'),
    bannerGroup('bottom'),
  ],
}
