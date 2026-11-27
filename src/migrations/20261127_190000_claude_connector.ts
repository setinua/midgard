import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Claude connector for journalists: per-user switch, secret link (shown to admins) and its hash for lookup.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "connector_enabled" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "connector_regenerate" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "connector_url" varchar;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "connector_token_hash" varchar;
  CREATE INDEX IF NOT EXISTS "users_connector_token_hash_idx" ON "users" USING btree ("connector_token_hash");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "users_connector_token_hash_idx";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "connector_token_hash";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "connector_url";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "connector_regenerate";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "connector_enabled";`)
}
