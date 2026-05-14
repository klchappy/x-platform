CREATE TABLE "damga_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid,
	"type" text NOT NULL,
	"method" text,
	"latitude" real,
	"longitude" real,
	"accuracy_m" real,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"client_time" timestamp with time zone,
	"server_time" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "damga_leaves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text DEFAULT 'annual' NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"business_days" integer DEFAULT 0 NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"decided_by_user_id" uuid,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lokma_recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"base_yield" real DEFAULT 1 NOT NULL,
	"yield_unit" text DEFAULT 'porsiyon' NOT NULL,
	"prep_minutes" integer,
	"cook_minutes" integer,
	"instructions" text,
	"ingredients" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"photo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "santral_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"direction" text NOT NULL,
	"contact_id" uuid,
	"external_number" text,
	"answered_by_user_id" uuid,
	"duration_sec" integer,
	"notes" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "santral_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"company" text,
	"title" text,
	"email" text,
	"phone" text,
	"phone_alt" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticaret_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"tax_no" text,
	"tax_office" text,
	"address" text,
	"phone" text,
	"email" text,
	"credit_limit_cents_try" integer DEFAULT 0 NOT NULL,
	"risk_score" text DEFAULT 'normal',
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticaret_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"sku" text,
	"name" text NOT NULL,
	"category" text,
	"unit" text DEFAULT 'adet' NOT NULL,
	"price_cents_try" integer DEFAULT 0 NOT NULL,
	"tax_rate_pct" real DEFAULT 20 NOT NULL,
	"stock_on_hand" real DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "damga_attendance" ADD CONSTRAINT "damga_attendance_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga_attendance" ADD CONSTRAINT "damga_attendance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga_leaves" ADD CONSTRAINT "damga_leaves_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga_leaves" ADD CONSTRAINT "damga_leaves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damga_leaves" ADD CONSTRAINT "damga_leaves_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lokma_recipes" ADD CONSTRAINT "lokma_recipes_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santral_calls" ADD CONSTRAINT "santral_calls_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santral_calls" ADD CONSTRAINT "santral_calls_contact_id_santral_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."santral_contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santral_calls" ADD CONSTRAINT "santral_calls_answered_by_user_id_users_id_fk" FOREIGN KEY ("answered_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santral_contacts" ADD CONSTRAINT "santral_contacts_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santral_contacts" ADD CONSTRAINT "santral_contacts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticaret_customers" ADD CONSTRAINT "ticaret_customers_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticaret_customers" ADD CONSTRAINT "ticaret_customers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticaret_products" ADD CONSTRAINT "ticaret_products_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "damga_attendance_org_time_idx" ON "damga_attendance" USING btree ("org_id","server_time");--> statement-breakpoint
CREATE INDEX "damga_attendance_user_idx" ON "damga_attendance" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "damga_leaves_org_idx" ON "damga_leaves" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "lokma_recipes_org_idx" ON "lokma_recipes" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "santral_calls_org_time_idx" ON "santral_calls" USING btree ("org_id","occurred_at");--> statement-breakpoint
CREATE INDEX "santral_contacts_org_idx" ON "santral_contacts" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "santral_contacts_name_idx" ON "santral_contacts" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "ticaret_customers_org_idx" ON "ticaret_customers" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "ticaret_products_org_idx" ON "ticaret_products" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "ticaret_products_sku_idx" ON "ticaret_products" USING btree ("sku");