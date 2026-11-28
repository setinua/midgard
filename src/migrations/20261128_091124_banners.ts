import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ads_top_kind" AS ENUM('adsense', 'code', 'image');
  CREATE TYPE "public"."enum_ads_middle_kind" AS ENUM('adsense', 'code', 'image');
  CREATE TYPE "public"."enum_ads_bottom_kind" AS ENUM('adsense', 'code', 'image');
  CREATE TABLE "ads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"adsense_client" varchar DEFAULT 'ca-pub-6934929927682255',
  	"top_active" boolean DEFAULT false,
  	"top_advertiser" varchar,
  	"top_kind" "enum_ads_top_kind" DEFAULT 'adsense',
  	"top_ad_slot" varchar,
  	"top_code" varchar,
  	"top_image_id" integer,
  	"top_mobile_image_id" integer,
  	"top_url" varchar,
  	"top_alt" varchar,
  	"top_starts_at" timestamp(3) with time zone,
  	"top_ends_at" timestamp(3) with time zone,
  	"middle_active" boolean DEFAULT false,
  	"middle_advertiser" varchar,
  	"middle_kind" "enum_ads_middle_kind" DEFAULT 'adsense',
  	"middle_ad_slot" varchar,
  	"middle_code" varchar,
  	"middle_image_id" integer,
  	"middle_mobile_image_id" integer,
  	"middle_url" varchar,
  	"middle_alt" varchar,
  	"middle_starts_at" timestamp(3) with time zone,
  	"middle_ends_at" timestamp(3) with time zone,
  	"bottom_active" boolean DEFAULT false,
  	"bottom_advertiser" varchar,
  	"bottom_kind" "enum_ads_bottom_kind" DEFAULT 'adsense',
  	"bottom_ad_slot" varchar,
  	"bottom_code" varchar,
  	"bottom_image_id" integer,
  	"bottom_mobile_image_id" integer,
  	"bottom_url" varchar,
  	"bottom_alt" varchar,
  	"bottom_starts_at" timestamp(3) with time zone,
  	"bottom_ends_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "ads" ADD CONSTRAINT "ads_top_image_id_media_id_fk" FOREIGN KEY ("top_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ads" ADD CONSTRAINT "ads_top_mobile_image_id_media_id_fk" FOREIGN KEY ("top_mobile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ads" ADD CONSTRAINT "ads_middle_image_id_media_id_fk" FOREIGN KEY ("middle_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ads" ADD CONSTRAINT "ads_middle_mobile_image_id_media_id_fk" FOREIGN KEY ("middle_mobile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ads" ADD CONSTRAINT "ads_bottom_image_id_media_id_fk" FOREIGN KEY ("bottom_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ads" ADD CONSTRAINT "ads_bottom_mobile_image_id_media_id_fk" FOREIGN KEY ("bottom_mobile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "ads_top_top_image_idx" ON "ads" USING btree ("top_image_id");
  CREATE INDEX "ads_top_top_mobile_image_idx" ON "ads" USING btree ("top_mobile_image_id");
  CREATE INDEX "ads_middle_middle_image_idx" ON "ads" USING btree ("middle_image_id");
  CREATE INDEX "ads_middle_middle_mobile_image_idx" ON "ads" USING btree ("middle_mobile_image_id");
  CREATE INDEX "ads_bottom_bottom_image_idx" ON "ads" USING btree ("bottom_image_id");
  CREATE INDEX "ads_bottom_bottom_mobile_image_idx" ON "ads" USING btree ("bottom_mobile_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "ads" CASCADE;
  DROP TYPE "public"."enum_ads_top_kind";
  DROP TYPE "public"."enum_ads_middle_kind";
  DROP TYPE "public"."enum_ads_bottom_kind";`)
}
