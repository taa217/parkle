CREATE TYPE "public"."confidence" AS ENUM('HIGH', 'MEDIUM', 'LOW');--> statement-breakpoint
CREATE TYPE "public"."issue_status" AS ENUM('OPEN', 'RESOLVED');--> statement-breakpoint
CREATE TYPE "public"."issue_type" AS ENUM('MARKED_AVAILABLE_BUT_FULL', 'BLOCKED', 'WRONG_RECOMMENDATION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."preference" AS ENUM('FASTEST_WALK', 'CLOSEST_DRIVE');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('STUDENT', 'STAFF', 'VISITOR', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."zone_status_status" AS ENUM('AVAILABLE', 'LIMITED', 'FULL', 'UNKNOWN');--> statement-breakpoint
CREATE TABLE "issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"zone_id" text NOT NULL,
	"type" "issue_type" NOT NULL,
	"note" varchar(200),
	"status" "issue_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "parking_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"zone_id" text NOT NULL,
	"plate" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"role" "role" DEFAULT 'STUDENT' NOT NULL,
	"primary_zone_id" text,
	"plate" text,
	"preference" "preference" DEFAULT 'FASTEST_WALK' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "zone_status" (
	"zone_id" text PRIMARY KEY NOT NULL,
	"status" "zone_status_status" DEFAULT 'UNKNOWN' NOT NULL,
	"confidence" "confidence" DEFAULT 'LOW' NOT NULL,
	"available_count" integer,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"capacity" integer
);
--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parking_events" ADD CONSTRAINT "parking_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parking_events" ADD CONSTRAINT "parking_events_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zone_status" ADD CONSTRAINT "zone_status_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;