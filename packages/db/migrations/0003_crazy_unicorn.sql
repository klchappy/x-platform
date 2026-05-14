CREATE TABLE "sayman_payables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" text NOT NULL,
	"counterparty" text,
	"category" text,
	"invoice_no" text,
	"period_label" text,
	"amount_cents_try" integer DEFAULT 0 NOT NULL,
	"paid_cents_try" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'TRY' NOT NULL,
	"due_date" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sayman_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"payable_id" uuid,
	"paid_at" text NOT NULL,
	"amount_cents_try" integer NOT NULL,
	"method" text DEFAULT 'havale' NOT NULL,
	"reference_no" text,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sayman_payables" ADD CONSTRAINT "sayman_payables_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sayman_payables" ADD CONSTRAINT "sayman_payables_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sayman_payments" ADD CONSTRAINT "sayman_payments_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sayman_payments" ADD CONSTRAINT "sayman_payments_payable_id_sayman_payables_id_fk" FOREIGN KEY ("payable_id") REFERENCES "public"."sayman_payables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sayman_payments" ADD CONSTRAINT "sayman_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sayman_payables_org_status_idx" ON "sayman_payables" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "sayman_payables_org_due_idx" ON "sayman_payables" USING btree ("org_id","due_date");--> statement-breakpoint
CREATE INDEX "sayman_payments_org_payable_idx" ON "sayman_payments" USING btree ("org_id","payable_id");--> statement-breakpoint
CREATE INDEX "sayman_payments_org_paid_at_idx" ON "sayman_payments" USING btree ("org_id","paid_at");