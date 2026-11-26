import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// «Читайте також»: 15 articles from 23–24 Nov had the manual field filled with just the newest
// articles at the time (often the article itself). Manual picks go first and took all 4 places,
// so matching by epoch never ran. Cleared only if the value is still exactly the one below
// (anything an editor changed since stays). Values are kept here and in ЖУРНАЛ.md (v30) for rollback.
const OLD: Record<number, number[]> = {
  58: [55, 47, 57],
  60: [60, 57, 47],
  61: [60, 58, 55, 47],
  62: [62, 60, 57, 55],
  63: [62, 61, 57],
  64: [64, 62, 60, 57],
  65: [65, 63, 61, 55],
  66: [66, 64, 62, 60],
  67: [67, 65, 63, 62],
  70: [67, 65, 63, 61],
  71: [70, 72, 65, 63],
  72: [67, 63, 65, 61],
  75: [75, 72, 67, 65],
  77: [72, 70, 67, 66],
  78: [78, 76, 72, 71],
}

type Rows = { rows: { articles_id: number }[] }

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const [key, old] of Object.entries(OLD)) {
    const id = Number(key)
    const cur = (await db.execute(
      sql`SELECT articles_id FROM "articles_rels" WHERE parent_id = ${id} AND path = 'related' ORDER BY "order"`,
    )) as unknown as Rows
    if (cur.rows.map((r) => r.articles_id).join(',') !== old.join(',')) continue
    await db.execute(sql`DELETE FROM "articles_rels" WHERE parent_id = ${id} AND path = 'related'`)
    // The latest version is what the admin opens; clear it too so a later save doesn't bring the picks back.
    await db.execute(sql`
      DELETE FROM "_articles_v_rels" WHERE path = 'version.related'
        AND parent_id IN (SELECT id FROM "_articles_v" WHERE parent_id = ${id} AND latest = true)`)
  }
}

export async function down(_: MigrateDownArgs): Promise<void> {
  // Restore by hand from OLD if ever needed.
}
