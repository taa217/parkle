CREATE TYPE "public"."sensor_event_type" AS ENUM('HEARTBEAT', 'STATUS_UPDATE');--> statement-breakpoint
CREATE TYPE "public"."sensor_status" AS ENUM('HEALTHY', 'WARNING', 'OFFLINE');--> statement-breakpoint
CREATE TYPE "public"."sensor_type" AS ENUM('UNITV', 'UNITV2', 'OTHER');--> statement-breakpoint
CREATE TABLE "sensor_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sensor_id" text NOT NULL,
	"event_type" "sensor_event_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sensors" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "sensor_type" DEFAULT 'OTHER' NOT NULL,
	"zone_id" text,
	"description" text,
	"last_heartbeat" timestamp,
	"last_seen_ip" text,
	"status" "sensor_status" DEFAULT 'OFFLINE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sensor_events" ADD CONSTRAINT "sensor_events_sensor_id_sensors_id_fk" FOREIGN KEY ("sensor_id") REFERENCES "public"."sensors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensors" ADD CONSTRAINT "sensors_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;