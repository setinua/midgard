import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { SLUG_MAX, slugBase, slugify } from '../lib/slug'

// Slugs that were auto-cut in the middle of a word (old limit) get re-cut at the last whole word.
// Only slugs exactly equal to the old auto-generated value are touched; hand-edited ones stay.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  const res = await db.execute(sql`SELECT id, title, slug FROM "articles" WHERE length(slug) = ${SLUG_MAX}`)
  const rows = (res as unknown as { rows: { id: number; title: string; slug: string }[] }).rows
  for (const r of rows) {
    const base = slugBase(r.title || '')
    if (base.length <= SLUG_MAX || r.slug !== base.slice(0, SLUG_MAX)) continue
    const next = slugify(r.title)
    if (next === r.slug) continue
    const taken = await db.execute(sql`SELECT 1 FROM "articles" WHERE slug = ${next} AND id <> ${r.id}`)
    if ((taken as unknown as { rows: unknown[] }).rows.length) continue
    await db.execute(sql`UPDATE "articles" SET slug = ${next} WHERE id = ${r.id}`)
    await db.execute(sql`UPDATE "_articles_v" SET version_slug = ${next} WHERE parent_id = ${r.id} AND version_slug = ${r.slug}`)
  }
}

export async function down(_: MigrateDownArgs): Promise<void> {
  // Old slugs were broken; nothing to restore.
}
