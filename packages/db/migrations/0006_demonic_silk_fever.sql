CREATE SCHEMA "damga";
--> statement-breakpoint
CREATE TYPE "damga"."announcement_category" AS ENUM('info', 'celebration', 'warning', 'urgent');--> statement-breakpoint
CREATE TYPE "damga"."attendance_event_type" AS ENUM('check_in', 'check_out', 'edit_request', 'manual_entry', 'admin_correction', 'dispute');--> statement-breakpoint
CREATE TYPE "damga"."leave_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "damga"."leave_type" AS ENUM('annual', 'sick', 'unpaid', 'maternity', 'paternity', 'compassionate');--> statement-breakpoint
CREATE TYPE "damga"."status_type" AS ENUM('running_late', 'on_lunch', 'sick', 'wfh', 'in_focus', 'on_business', 'on_break');--> statement-breakpoint
CREATE TABLE "damga"."location_nfc_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"tag_id" text NOT NULL,
	"label" text,
	"payload" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "damga"."location_qr_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"label" text,
	"payload" text NOT NULL,
	"ttl_days" integer DEFAULT 90 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "damga"."locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text,
	"timezone" text DEFAULT 'Europe/Istanbul' NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"geofence_radius_m" integer DEFAULT 100 NOT NULL,
	"wifi_bssids" text[] DEFAULT '{}'::text[] NOT NULL,
	"nfc_tag_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"qr_codes" text[] DEFAULT '{}'::text[] NOT NULL,
	"work_hours_start" text DEFAULT '09:00' NOT NULL,
	"work_hours_end" text DEFAULT '18:00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "damga"."attendance_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "damga"."attendance_event_type" NOT NULL,
	"client_time" timestamp with time zone NOT NULL,
	"server_time" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_time" timestamp with time zone NOT NULL,
	"timezone_at_time" text DEFAULT 'Europe/Istanbul' NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"gps_accuracy_m" integer,
	"location_id" uuid,
	"distance_from_office_m" integer,
	"nfc_tag_id" text,
	"nfc_signature" text,
	"qr_code_payload" text,
	"wifi_bssid" text,
	"device_id" text,
	"ip_address" text,
	"user_agent" text,
	"verification_methods" text[] DEFAULT '{}'::text[] NOT NULL,
	"verification_score" integer NOT NULL,
	"evidence_hash" text NOT NULL,
	"previous_event_hash" text,
	"this_event_hash" text NOT NULL,
	"supersedes_event_id" uuid,
	"edit_reason" text,
	"edited_by_user_id" uuid,
	"app_version" text,
	"device_info" jsonb,
	"flags" text[] DEFAULT '{}'::text[] NOT NULL,
	"review_status" text DEFAULT 'approved' NOT NULL,
	"selfie_url" text,
	"review_reasons" text[] DEFAULT '{}'::text[] NOT NULL,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "damga"."leaves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "damga"."leave_type" DEFAULT 'annual' NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"half_day" boolean DEFAULT false NOT NULL,
	"business_days" integer DEFAULT 0 NOT NULL,
	"reason" text,
	"status" "damga"."leave_status" DEFAULT 'pending' NOT NULL,
	"approved_by_user_id" uuid,
	"approved_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "damga"."overtime_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"shift_assignment_id" uuid,
	"event_id" uuid,
	"overtime_minutes" integer NOT NULL,
	"expected_end" timestamp with time zone NOT NULL,
	"actual_end" timestamp with time zone NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by_user_id" uuid,
	"approved_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "damga"."shift_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"shift_template_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"shift_date" text NOT NULL,
	"override_start" text,
	"override_end" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "damga"."shift_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"location_id" uuid,
	"name" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"break_minutes" integer DEFAULT 60 NOT NULL,
	"color" text DEFAULT '#94a3b8' NOT NULL,
	"overtime_threshold_minutes" integer DEFAULT 15 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "damga"."rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text DEFAULT '🎁' NOT NULL,
	"cost_xp" integer NOT NULL,
	"stock" integer,
	"per_user_limit" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"market_type" text DEFAULT 'standard' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "damga"."user_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reward_id" uuid NOT NULL,
	"cost_xp" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"xp_transaction_id" uuid,
	"fulfilled_by_user_id" uuid,
	"fulfilled_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "damga"."xp_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"source" text NOT NULL,
	"amount" integer NOT NULL,
	"description" text,
	"ref_id" uuid,
	"ref_type" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "damga"."location_nfc_tags" ADD CONSTRAINT "location_nfc_tags_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "damga"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."location_nfc_tags" ADD CONSTRAINT "location_nfc_tags_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."location_nfc_tags" ADD CONSTRAINT "location_nfc_tags_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."location_qr_codes" ADD CONSTRAINT "location_qr_codes_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "damga"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."location_qr_codes" ADD CONSTRAINT "location_qr_codes_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."location_qr_codes" ADD CONSTRAINT "location_qr_codes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."locations" ADD CONSTRAINT "locations_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."attendance_events" ADD CONSTRAINT "attendance_events_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."attendance_events" ADD CONSTRAINT "attendance_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."attendance_events" ADD CONSTRAINT "attendance_events_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "damga"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."attendance_events" ADD CONSTRAINT "attendance_events_edited_by_user_id_users_id_fk" FOREIGN KEY ("edited_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."attendance_events" ADD CONSTRAINT "attendance_events_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."leaves" ADD CONSTRAINT "leaves_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."leaves" ADD CONSTRAINT "leaves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."leaves" ADD CONSTRAINT "leaves_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."overtime_records" ADD CONSTRAINT "overtime_records_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."overtime_records" ADD CONSTRAINT "overtime_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."overtime_records" ADD CONSTRAINT "overtime_records_shift_assignment_id_shift_assignments_id_fk" FOREIGN KEY ("shift_assignment_id") REFERENCES "damga"."shift_assignments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."overtime_records" ADD CONSTRAINT "overtime_records_event_id_attendance_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "damga"."attendance_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."overtime_records" ADD CONSTRAINT "overtime_records_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."shift_assignments" ADD CONSTRAINT "shift_assignments_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."shift_assignments" ADD CONSTRAINT "shift_assignments_shift_template_id_shift_templates_id_fk" FOREIGN KEY ("shift_template_id") REFERENCES "damga"."shift_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."shift_assignments" ADD CONSTRAINT "shift_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."shift_templates" ADD CONSTRAINT "shift_templates_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."shift_templates" ADD CONSTRAINT "shift_templates_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "damga"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."shift_templates" ADD CONSTRAINT "shift_templates_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."rewards" ADD CONSTRAINT "rewards_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."user_redemptions" ADD CONSTRAINT "user_redemptions_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."user_redemptions" ADD CONSTRAINT "user_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."user_redemptions" ADD CONSTRAINT "user_redemptions_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "damga"."rewards"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."user_redemptions" ADD CONSTRAINT "user_redemptions_xp_transaction_id_xp_transactions_id_fk" FOREIGN KEY ("xp_transaction_id") REFERENCES "damga"."xp_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."user_redemptions" ADD CONSTRAINT "user_redemptions_fulfilled_by_user_id_users_id_fk" FOREIGN KEY ("fulfilled_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."xp_transactions" ADD CONSTRAINT "xp_transactions_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga"."xp_transactions" ADD CONSTRAINT "xp_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_damga_nfc_tags_location" ON "damga"."location_nfc_tags" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "idx_damga_nfc_tags_tag_id" ON "damga"."location_nfc_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_damga_qr_codes_location" ON "damga"."location_qr_codes" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "idx_damga_locations_org" ON "damga"."locations" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_damga_events_org_user_time" ON "damga"."attendance_events" USING btree ("org_id","user_id","server_time");--> statement-breakpoint
CREATE INDEX "idx_damga_events_hash" ON "damga"."attendance_events" USING btree ("this_event_hash");--> statement-breakpoint
CREATE INDEX "idx_damga_events_type" ON "damga"."attendance_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_damga_events_location" ON "damga"."attendance_events" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "idx_damga_events_review_status" ON "damga"."attendance_events" USING btree ("org_id","review_status");--> statement-breakpoint
CREATE INDEX "idx_damga_leaves_org_user" ON "damga"."leaves" USING btree ("org_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_damga_leaves_org_status" ON "damga"."leaves" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "idx_damga_overtime_org_user" ON "damga"."overtime_records" USING btree ("org_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_damga_shift_assignments_org_user_date" ON "damga"."shift_assignments" USING btree ("org_id","user_id","shift_date");--> statement-breakpoint
CREATE INDEX "idx_damga_shift_templates_org" ON "damga"."shift_templates" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_damga_rewards_org" ON "damga"."rewards" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_damga_redemptions_org_user" ON "damga"."user_redemptions" USING btree ("org_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_damga_xp_user_time" ON "damga"."xp_transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_damga_xp_org_time" ON "damga"."xp_transactions" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_damga_xp_source" ON "damga"."xp_transactions" USING btree ("source");