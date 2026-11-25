// T5 check: «Читайте також» against the table from developer brief #2 (19 live articles, 25 Nov 2026).
// Run: npx tsx --conditions=react-server tests/related.test.ts
import { getRelated } from '../src/lib/data'

// [#, region, epoch, published UTC]; # = position by date, 0 = newest. Ids: higher = newer.
const T: [number, string, string, string][] = [
  [0, 'pivnichna-amerika', 'paleolit', '2026-11-24T17:25Z'], [1, 'yevropa', 'antychnist', '2026-11-24T16:44Z'],
  [2, 'aziia', 'paleolit', '2026-11-24T16:36Z'], [3, 'afryka', 'paleolit', '2026-11-24T16:30Z'],
  [4, 'afryka', 'suchasnist', '2026-11-24T16:04Z'], [5, 'yevropa', 'neolit', '2026-11-24T16:02Z'],
  [6, 'yevropa', 'xx-stolittia', '2026-11-24T15:36Z'], [7, 'yevropa', 'antychnist', '2026-11-23T18:33Z'],
  [8, 'yevropa', 'bronzova-doba', '2026-11-23T18:27Z'], [9, 'afryka', 'zalizna-doba', '2026-11-23T18:19Z'],
  [10, 'pivnichna-amerika', 'neolit', '2026-11-23T18:05Z'], [11, 'pivnichna-amerika', 'bronzova-doba', '2026-11-23T17:58Z'],
  [12, 'yevropa', 'serednovichchia', '2026-11-23T17:49Z'], [13, 'yevropa', 'serednovichchia', '2026-11-23T17:41Z'],
  [14, 'yevropa', 'bronzova-doba', '2026-11-23T17:35Z'], [15, 'aziia', 'xx-stolittia', '2026-11-23T17:24Z'],
  [16, 'pivnichna-amerika', 'serednovichchia', '2026-11-23T17:08Z'], [17, 'yevropa', 'antychnist', '2026-11-23T12:18Z'],
  [18, 'aziia', 'paleolit', '2026-11-23T11:28Z'],
]
const EXPECTED: number[][] = [
  [2, 3, 18, 10], [7, 17, 5, 6], [0, 3, 18, 15], [0, 2, 18, 4], [3, 9, 0, 1], [10, 1, 6, 7], [15, 1, 5, 7],
  [1, 17, 5, 6], [11, 14, 1, 5], [3, 4, 0, 1], [5, 0, 11, 16], [8, 14, 0, 10], [13, 16, 1, 5], [12, 16, 1, 5],
  [8, 11, 1, 5], [6, 2, 18, 0], [12, 13, 0, 10], [1, 7, 5, 6], [0, 2, 3, 15],
]
const regions = [...new Set(T.map((r) => r[1]))], epochs = [...new Set(T.map((r) => r[2]))]
const docs = T.map(([n, r, e, d]) => ({
  id: 100 - n, n, type: 'news', publishedAt: d, _status: 'published', related: [], regions: [], epochs: [],
  primaryRegion: { id: regions.indexOf(r) + 1 }, primaryEpoch: { id: epochs.indexOf(e) + 1 },
}))

// Minimal evaluator for the where-clauses getRelated builds (in / or / not_equals), sorted like findArticles.
const val = (d: any, f: string) => { const v = d[f]; return Array.isArray(v) ? v.map((x: any) => x.id ?? x) : [v?.id ?? v] }
const match = (d: any, w: any): boolean => {
  if (w.or) return w.or.some((x: any) => match(d, x))
  const [f, cond] = Object.entries(w)[0] as [string, any]
  if ('in' in cond) return val(d, f).some((x: any) => cond.in.includes(x))
  if ('not_equals' in cond) return d[f] !== cond.not_equals
  throw new Error('unsupported ' + JSON.stringify(w))
}
const find = (async (o: any) => {
  const out = docs.filter((d) => !(o.exclude || []).includes(d.id) && (o.where || []).every((w: any) => match(d, w)))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.id - a.id).slice(0, o.limit)
  return { docs: out, totalDocs: out.length, totalPages: 1 }
}) as any

let bad = 0
for (const d of docs) {
  const got = (await getRelated(d as any, find)).map((x: any) => x.n)
  const exp = EXPECTED[d.n]
  const ok = JSON.stringify(got) === JSON.stringify(exp) && !got.includes(d.n)
  if (!ok) bad++
  console.log(`${ok ? 'OK ' : 'BAD'} #${d.n}: ${got.join(', ')}${ok ? '' : `  (очікувалось ${exp.join(', ')})`}`)
}
// Manual picks go first, self is dropped from them.
const m = { ...docs[18], related: [docs[18], docs[9]] }
const gotM = (await getRelated(m as any, find)).map((x: any) => x.n)
console.log(`${gotM[0] === 9 && !gotM.includes(18) ? 'OK ' : 'BAD'} ручний вибір першим: ${gotM.join(', ')}`)
if (gotM[0] !== 9 || gotM.includes(18)) bad++
console.log(bad ? `\nПОМИЛОК: ${bad}` : '\nУсі рядки збігаються')
process.exit(bad ? 1 : 0)
