const TZ = 'Europe/Kyiv'
const d = (v: string | Date) => (typeof v === 'string' ? new Date(v) : v)

export const time = (v: string) => new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit', timeZone: TZ }).format(d(v))
export const date = (v: string) => new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }).format(d(v)).replace(' р.', '')
export const dateTime = (v: string) => `${date(v)}, ${time(v)}`

// «Сьогодні, 15:02» for today, otherwise «18 листопада, 14:26».
export function smart(v: string) {
  const fmt = (x: Date) => new Intl.DateTimeFormat('uk-UA', { dateStyle: 'short', timeZone: TZ }).format(x)
  if (fmt(d(v)) === fmt(new Date())) return `Сьогодні, ${time(v)}`
  const dm = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', timeZone: TZ }).format(d(v))
  return `${dm}, ${time(v)}`
}
