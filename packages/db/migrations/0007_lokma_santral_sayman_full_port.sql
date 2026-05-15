-- Full port: lokma, santral, sayman → pgSchema('<id>') namespace tabloları
-- Eski public.<mod>_* stub tablolar drop ediliyor (henüz veri yok)

-- ============ Drop legacy stub tables ============
DROP TABLE IF EXISTS "public"."lokma_recipes" CASCADE;
DROP TABLE IF EXISTS "public"."santral_contacts" CASCADE;
DROP TABLE IF EXISTS "public"."santral_calls" CASCADE;
DROP TABLE IF EXISTS "public"."sayman_payables" CASCADE;
DROP TABLE IF EXISTS "public"."sayman_payments" CASCADE;
--> statement-breakpoint

-- ============ Schemas ============
CREATE SCHEMA IF NOT EXISTS "sayman";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "santral";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "lokma";
--> statement-breakpoint

-- ============ Sayman enums ============
DO $$ BEGIN
  CREATE TYPE "sayman"."owner_type" AS ENUM ('company','person','institution','self');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "sayman"."payable_status" AS ENUM ('draft','pending','approaching','overdue','partial_paid','paid','cancelled','archived','needs_review','waiting_approval');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "sayman"."payment_method" AS ENUM ('havale','eft','kart','nakit','cek','senet','otomatik_odeme','diger');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "sayman"."transaction_status" AS ENUM ('pending','approved','rejected','reversed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

-- ============ Sayman tables ============
CREATE TABLE IF NOT EXISTS "sayman"."banks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "short_code" text,
  "iban" text,
  "account_no" text,
  "currency" text NOT NULL DEFAULT 'TRY',
  "notes" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sayman_banks_org" ON "sayman"."banks" ("org_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "sayman"."institutions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "institution_type" text,
  "notes" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sayman_institutions_org" ON "sayman"."institutions" ("org_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "sayman"."companies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "legal_name" text,
  "tax_number" text,
  "tax_office" text,
  "phone" text,
  "email" text,
  "address" text,
  "notes" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_by" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sayman_companies_org" ON "sayman"."companies" ("org_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "sayman"."persons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "full_name" text NOT NULL,
  "national_id" text,
  "phone" text,
  "email" text,
  "family_group" text,
  "notes" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_by" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sayman_persons_org" ON "sayman"."persons" ("org_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "sayman"."payable_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "owner_type" "sayman"."owner_type" NOT NULL DEFAULT 'company',
  "company_id" uuid REFERENCES "sayman"."companies"("id") ON DELETE SET NULL,
  "person_id" uuid REFERENCES "sayman"."persons"("id") ON DELETE SET NULL,
  "institution_id" uuid REFERENCES "sayman"."institutions"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "category" text,
  "supplier_name" text,
  "invoice_number" text,
  "subscription_reference" text,
  "period_label" text,
  "issue_date" date,
  "due_date" date,
  "auto_payment_date" date,
  "amount" numeric(15,2) NOT NULL,
  "paid_amount" numeric(15,2) NOT NULL DEFAULT '0',
  "currency" text NOT NULL DEFAULT 'TRY',
  "status" "sayman"."payable_status" NOT NULL DEFAULT 'pending',
  "expected_method" "sayman"."payment_method",
  "notes" text,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "needs_review" boolean NOT NULL DEFAULT false,
  "auto_created_source" text,
  "reviewed_at" timestamptz,
  "reviewed_by" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "created_by" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sayman_payable_org" ON "sayman"."payable_items" ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sayman_payable_status" ON "sayman"."payable_items" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sayman_payable_due" ON "sayman"."payable_items" ("due_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sayman_payable_period" ON "sayman"."payable_items" ("org_id","period_label");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "sayman"."payment_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "payable_id" uuid NOT NULL REFERENCES "sayman"."payable_items"("id") ON DELETE CASCADE,
  "paid_at" date NOT NULL,
  "amount" numeric(15,2) NOT NULL,
  "method" "sayman"."payment_method" NOT NULL,
  "bank_short_code" text,
  "receipt_url" text,
  "reference_no" text,
  "status" "sayman"."transaction_status" NOT NULL DEFAULT 'approved',
  "notes" text,
  "created_by" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sayman_tx_org_payable" ON "sayman"."payment_transactions" ("org_id","payable_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sayman_tx_paid_at" ON "sayman"."payment_transactions" ("paid_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "sayman"."regular_payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "institution_id" uuid REFERENCES "sayman"."institutions"("id") ON DELETE SET NULL,
  "company_id" uuid REFERENCES "sayman"."companies"("id") ON DELETE SET NULL,
  "person_id" uuid REFERENCES "sayman"."persons"("id") ON DELETE SET NULL,
  "cadence" text NOT NULL DEFAULT 'monthly',
  "day_of_month" text,
  "estimated_amount" numeric(15,2),
  "currency" text NOT NULL DEFAULT 'TRY',
  "expected_method" "sayman"."payment_method",
  "notes" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "next_due_date" date,
  "created_by" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sayman_regular_org" ON "sayman"."regular_payments" ("org_id");
--> statement-breakpoint

-- ============ Santral enums ============
DO $$ BEGIN
  CREATE TYPE "santral"."call_direction" AS ENUM ('inbound','outbound','missed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "santral"."task_priority" AS ENUM ('low','normal','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "santral"."task_status" AS ENUM ('open','in_progress','blocked','done','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

-- ============ Santral tables ============
CREATE TABLE IF NOT EXISTS "santral"."contacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "full_name" text NOT NULL,
  "company" text,
  "title" text,
  "email" text,
  "phone" text,
  "phone_alt" text,
  "tags" jsonb DEFAULT '[]',
  "notes" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_by" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_santral_contacts_org" ON "santral"."contacts" ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_santral_contacts_name" ON "santral"."contacts" ("org_id","full_name");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "santral"."directory_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "full_name" text NOT NULL,
  "department" text,
  "manager_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "phone_work" text,
  "phone_mobile" text,
  "phone_internal" text,
  "extra" jsonb DEFAULT '{}',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_santral_directory_org" ON "santral"."directory_entries" ("org_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "santral"."calls" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "direction" "santral"."call_direction" NOT NULL,
  "contact_id" uuid REFERENCES "santral"."contacts"("id") ON DELETE SET NULL,
  "external_number" text,
  "answered_by_user_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "forwarded_to_user_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "duration_sec" integer,
  "notes" text,
  "occurred_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_santral_calls_org_time" ON "santral"."calls" ("org_id","occurred_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_santral_calls_contact" ON "santral"."calls" ("contact_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "santral"."tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "assignee_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "priority" "santral"."task_priority" NOT NULL DEFAULT 'normal',
  "status" "santral"."task_status" NOT NULL DEFAULT 'open',
  "due_at" timestamptz,
  "related_people" jsonb DEFAULT '[]',
  "created_by" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_santral_tasks_org_status" ON "santral"."tasks" ("org_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_santral_tasks_assignee" ON "santral"."tasks" ("assignee_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "santral"."calendar_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "location" text,
  "start_at" timestamptz NOT NULL,
  "end_at" timestamptz NOT NULL,
  "is_all_day" boolean NOT NULL DEFAULT false,
  "is_cancelled" boolean NOT NULL DEFAULT false,
  "visibility" text NOT NULL DEFAULT 'org',
  "owner_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_santral_calendar_org_start" ON "santral"."calendar_events" ("org_id","start_at");
--> statement-breakpoint

-- ============ Lokma enums ============
DO $$ BEGIN
  CREATE TYPE "lokma"."kitchen_type" AS ENUM ('restaurant','hotel','home','catering','cloud_kitchen','cafeteria');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "lokma"."unit_kind" AS ENUM ('mass','volume','count','length');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "lokma"."meal_type" AS ENUM ('breakfast','lunch','dinner','snack');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "lokma"."stock_movement_type" AS ENUM ('in','out_prod','out_waste','transfer','adjustment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

-- ============ Lokma tables ============
CREATE TABLE IF NOT EXISTS "lokma"."kitchens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "kitchen_type" "lokma"."kitchen_type" NOT NULL DEFAULT 'restaurant',
  "address" text,
  "capacity" integer,
  "timezone" text NOT NULL DEFAULT 'Europe/Istanbul',
  "settings" jsonb DEFAULT '{}',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lokma_kitchens_org" ON "lokma"."kitchens" ("org_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "lokma"."suppliers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "contact_person" text,
  "phone" text,
  "email" text,
  "address" text,
  "payment_terms" text,
  "tax_no" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lokma_suppliers_org" ON "lokma"."suppliers" ("org_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "lokma"."ingredients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "category" text,
  "name" text NOT NULL,
  "sku" text,
  "default_unit" text NOT NULL DEFAULT 'kg',
  "default_waste_pct" real NOT NULL DEFAULT 0,
  "last_unit_price" real NOT NULL DEFAULT 0,
  "allergens" jsonb DEFAULT '[]',
  "storage_info" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lokma_ingredients_org" ON "lokma"."ingredients" ("org_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "lokma"."recipes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "kitchen_id" uuid REFERENCES "lokma"."kitchens"("id") ON DELETE SET NULL,
  "category" text,
  "name" text NOT NULL,
  "base_yield" real NOT NULL DEFAULT 1,
  "yield_unit" text NOT NULL DEFAULT 'porsiyon',
  "prep_minutes" integer,
  "cook_minutes" integer,
  "instructions" text,
  "ingredients" jsonb DEFAULT '[]',
  "tags" jsonb DEFAULT '[]',
  "photo_url" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lokma_recipes_org" ON "lokma"."recipes" ("org_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "lokma"."stock_lots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "kitchen_id" uuid REFERENCES "lokma"."kitchens"("id") ON DELETE SET NULL,
  "ingredient_id" uuid NOT NULL REFERENCES "lokma"."ingredients"("id") ON DELETE CASCADE,
  "lot_code" text,
  "qty_received" real NOT NULL,
  "qty_remaining" real NOT NULL,
  "unit" text NOT NULL,
  "unit_price" real NOT NULL DEFAULT 0,
  "received_at" date,
  "expiry_date" date,
  "supplier_name" text,
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lokma_lots_org_ing" ON "lokma"."stock_lots" ("org_id","ingredient_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lokma_lots_expiry" ON "lokma"."stock_lots" ("expiry_date");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "lokma"."stock_movements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "kitchen_id" uuid REFERENCES "lokma"."kitchens"("id") ON DELETE SET NULL,
  "ingredient_id" uuid NOT NULL REFERENCES "lokma"."ingredients"("id") ON DELETE CASCADE,
  "lot_id" uuid REFERENCES "lokma"."stock_lots"("id") ON DELETE SET NULL,
  "movement_type" "lokma"."stock_movement_type" NOT NULL,
  "quantity" real NOT NULL,
  "unit" text NOT NULL,
  "unit_price" real,
  "reference_type" text,
  "reference_id" uuid,
  "reason" text,
  "notes" text,
  "occurred_at" timestamptz NOT NULL DEFAULT now(),
  "created_by" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lokma_movements_org_ing_time" ON "lokma"."stock_movements" ("org_id","ingredient_id","occurred_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lokma_movements_type" ON "lokma"."stock_movements" ("movement_type");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "lokma"."purchase_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "kitchen_id" uuid REFERENCES "lokma"."kitchens"("id") ON DELETE SET NULL,
  "supplier_name" text NOT NULL,
  "order_date" date NOT NULL DEFAULT current_date,
  "expected_date" date,
  "received_date" date,
  "total_amount" real NOT NULL DEFAULT 0,
  "currency" text NOT NULL DEFAULT 'TRY',
  "status" text NOT NULL DEFAULT 'draft',
  "items" jsonb DEFAULT '[]',
  "notes" text,
  "created_by" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lokma_po_org_status" ON "lokma"."purchase_orders" ("org_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lokma_po_date" ON "lokma"."purchase_orders" ("order_date");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "lokma"."menu_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "kitchen_id" uuid REFERENCES "lokma"."kitchens"("id") ON DELETE SET NULL,
  "plan_date" date NOT NULL,
  "meal_type" "lokma"."meal_type" NOT NULL DEFAULT 'lunch',
  "expected_servings" integer NOT NULL DEFAULT 0,
  "actual_servings" integer,
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lokma_menu_org_date" ON "lokma"."menu_plans" ("org_id","plan_date");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "lokma"."menu_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "plan_id" uuid NOT NULL REFERENCES "lokma"."menu_plans"("id") ON DELETE CASCADE,
  "recipe_id" uuid REFERENCES "lokma"."recipes"("id") ON DELETE SET NULL,
  "recipe_name" text NOT NULL,
  "portions" real NOT NULL DEFAULT 1,
  "course" text,
  "notes" text,
  "is_active" boolean NOT NULL DEFAULT true
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lokma_menu_items_plan" ON "lokma"."menu_items" ("plan_id");
