// Ukrainian → Latin transliteration (official 2010 system), for URL slugs.
const MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', '’': '', "'": '', ʼ: '',
}
const START: Record<string, string> = { є: 'ye', ї: 'yi', й: 'y', ю: 'yu', я: 'ya' }

// Full transliterated slug, before length limit.
export function slugBase(input: string): string {
  return input
    .toLowerCase()
    .split(/(\s+)/)
    .map((word) =>
      [...word].map((ch, i) => (i === 0 && START[ch]) || (ch in MAP ? MAP[ch] : ch)).join(''),
    )
    .join('')
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const slugify = (input: string): string => cutAtWord(slugBase(input), SLUG_MAX)

export const SLUG_MAX = 90

// Long slugs are cut at the last whole word, not in the middle of one.
function cutAtWord(s: string, max: number): string {
  if (s.length <= max) return s
  const dash = s.lastIndexOf('-', max)
  return (dash > max / 2 ? s.slice(0, dash) : s.slice(0, max)).replace(/-+$/, '')
}
