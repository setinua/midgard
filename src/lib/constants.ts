// Material types: slug used in URL, label shown on site, admin label.
export const ARTICLE_TYPES = [
  { value: 'news', path: 'novyny', label: 'Новини', single: 'Новина' },
  { value: 'publication', path: 'publikatsii', label: 'Публікації', single: 'Публікація' },
  { value: 'interview', path: 'interviu', label: 'Інтерв’ю', single: 'Інтерв’ю' },
  { value: 'special', path: 'spetsproiekty', label: 'Спецпроєкти', single: 'Спецпроєкт' },
  { value: 'partner', path: 'partnerski', label: 'Партнерські матеріали', single: 'Партнерський матеріал' },
] as const

export type ArticleType = (typeof ARTICLE_TYPES)[number]['value']

export const typeByValue = (v: string) => ARTICLE_TYPES.find((t) => t.value === v)
export const typeByPath = (p: string) => ARTICLE_TYPES.find((t) => t.path === p)

export const REGIONS = [
  ['Європа', 'yevropa'],
  ['Азія', 'aziia'],
  ['Африка', 'afryka'],
  ['Північна Америка', 'pivnichna-amerika'],
  ['Південна Америка', 'pivdenna-amerika'],
  ['Австралія та Океанія', 'avstraliia-ta-okeaniia'],
] as const

export const EPOCHS = [
  ['Палеоліт', 'paleolit'],
  ['Мезоліт', 'mezolit'],
  ['Неоліт', 'neolit'],
  ['Енеоліт', 'eneolit'],
  ['Бронзова доба', 'bronzova-doba'],
  ['Залізна доба', 'zalizna-doba'],
  ['Античність', 'antychnist'],
  ['Середньовіччя', 'serednovichchia'],
  ['Ранньомодерна доба', 'rannomoderna-doba'],
  ['Індустріальна доба', 'industrialna-doba'],
  ['XX століття', 'xx-stolittia'],
  ['Сучасність', 'suchasnist'],
] as const

export const SITE_NAME = 'Мідгард'
export const SITE_TAGLINE = 'Загублений світ людей'
export const SITE_URL = (process.env.SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
export const PAGE_SIZE = 12
