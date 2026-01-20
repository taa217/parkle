CREATE TYPE "public"."override_event_action" AS ENUM('SET', 'UPDATE', 'CLEAR', 'EXPIRE');--> statement-breakpoint
CREATE TYPE "public"."zone_override_status" AS ENUM('AVAILABLE', 'LIMITED', 'FULL', 'UNKNOWN');--> statement-breakpoint
CREATE TABLE "override_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" text NOT NULL,
	"action" "override_event_action" NOT NULL,
	"before_status" "zone_override_status",
	"before_available_count" integer,
	"before_expires_at" timestamp,
	"after_status" "zone_override_status",
	"after_available_count" integer,
	"after_expires_at" timestamp,
	"reason" text,
	"performed_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zone_overrides" (
	"zone_id" text PRIMARY KEY NOT NULL,
	"forced_status" "zone_override_status",
	"forced_available_count" integer,
	"reason" text NOT NULL,
	"expires_at" timestamp,
	"updated_by" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "override_events" ADD CONSTRAINT "override_events_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "override_events" ADD CONSTRAINT "override_events_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zone_overrides" ADD CONSTRAINT "zone_overrides_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zone_overrides" ADD CONSTRAINT "zone_overrides_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;