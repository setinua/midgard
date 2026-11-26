import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Only the new «Розділи» global table. The generator also proposed dropping media._objectkey
// and rebuilding the article type enums — deliberately left out (data loss / unrelated).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "sections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"news_title" varchar,
  	"news_text" jsonb,
  	"news_seo_description" varchar,
  	"publication_title" varchar,
  	"publication_text" jsonb,
  	"publication_seo_description" varchar,
  	"interview_title" varchar,
  	"interview_text" jsonb,
  	"interview_seo_description" varchar,
  	"special_title" varchar,
  	"special_text" jsonb,
  	"special_seo_description" varchar,
  	"partner_title" varchar,
  	"partner_text" jsonb,
  	"partner_seo_description" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "sections" CASCADE;`)
}
