CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"color" text DEFAULT '#94a3b8',
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"request_hash" text NOT NULL,
	"response_status" integer,
	"response_body" jsonb,
	"org_id" uuid,
	"api_key_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"response_status" integer,
	"response_body" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"url" text NOT NULL,
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"secret" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"last_failure_at" timestamp with time zone,
	"last_success_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etik_investigation_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"report_id" uuid NOT NULL,
	"author_user_id" uuid,
	"kind" text DEFAULT 'note' NOT NULL,
	"body" text NOT NULL,
	"is_internal" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etik_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"public_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"is_anonymous" boolean DEFAULT true NOT NULL,
	"reporter_user_id" uuid,
	"reporter_token" text,
	"reporter_contact" text,
	"accused_description" text,
	"incident_date" text,
	"incident_location" text,
	"evidence" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'open' NOT NULL,
	"assigned_to_user_id" uuid,
	"decision" text,
	"decided_at" timestamp with time zone,
	"decided_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "envanter_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"type" text NOT NULL,
	"quantity" real NOT NULL,
	"reason" text,
	"reference_no" text,
	"notes" text,
	"occurred_at" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "envanter_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"sku" text,
	"barcode" text,
	"name" text NOT NULL,
	"category" text,
	"unit" text DEFAULT 'adet' NOT NULL,
	"min_stock" real DEFAULT 0 NOT NULL,
	"current_stock" real DEFAULT 0 NOT NULL,
	"cost_cents_try" integer DEFAULT 0 NOT NULL,
	"price_cents_try" integer DEFAULT 0 NOT NULL,
	"location" text,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_id_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etik_investigation_notes" ADD CONSTRAINT "etik_investigation_notes_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etik_investigation_notes" ADD CONSTRAINT "etik_investigation_notes_report_id_etik_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."etik_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etik_investigation_notes" ADD CONSTRAINT "etik_investigation_notes_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etik_reports" ADD CONSTRAINT "etik_reports_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etik_reports" ADD CONSTRAINT "etik_reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etik_reports" ADD CONSTRAINT "etik_reports_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etik_reports" ADD CONSTRAINT "etik_reports_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envanter_movements" ADD CONSTRAINT "envanter_movements_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envanter_movements" ADD CONSTRAINT "envanter_movements_product_id_envanter_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."envanter_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envanter_movements" ADD CONSTRAINT "envanter_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envanter_products" ADD CONSTRAINT "envanter_products_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envanter_products" ADD CONSTRAINT "envanter_products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "departments_org_slug_uq" ON "departments" USING btree ("org_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_key_method_path_uq" ON "idempotency_keys" USING btree ("key","method","path");--> statement-breakpoint
CREATE INDEX "idempotency_created_idx" ON "idempotency_keys" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_webhook_idx" ON "webhook_deliveries" USING btree ("webhook_id","created_at");--> statement-breakpoint
CREATE INDEX "webhooks_org_idx" ON "webhooks" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "etik_notes_report_idx" ON "etik_investigation_notes" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "etik_reports_org_status_idx" ON "etik_reports" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "etik_reports_org_public_id_idx" ON "etik_reports" USING btree ("org_id","public_id");--> statement-breakpoint
CREATE INDEX "etik_reports_org_created_idx" ON "etik_reports" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "envanter_movements_org_product_idx" ON "envanter_movements" USING btree ("org_id","product_id");--> statement-breakpoint
CREATE INDEX "envanter_movements_org_time_idx" ON "envanter_movements" USING btree ("org_id","occurred_at");--> statement-breakpoint
CREATE INDEX "envanter_products_org_idx" ON "envanter_products" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "envanter_products_sku_idx" ON "envanter_products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "envanter_products_barcode_idx" ON "envanter_products" USING btree ("barcode");