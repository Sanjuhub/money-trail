CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"kind" varchar(12) DEFAULT 'asset' NOT NULL,
	"opening_balance" numeric(14, 2) DEFAULT '0' NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"name" varchar(60) NOT NULL,
	"type" varchar(12) DEFAULT 'expense' NOT NULL,
	"parent_id" uuid,
	"icon" varchar(16),
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_name_parent_idx" ON "categories" USING btree ("user_id", "name", "parent_id");
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"type" varchar(12) DEFAULT 'expense' NOT NULL,
	"description" varchar(160) NOT NULL,
	"merchant" varchar(120),
	"category_id" uuid REFERENCES "categories"("id") ON DELETE SET NULL,
	"category" varchar(60) DEFAULT 'Other' NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"transaction_date" date NOT NULL,
	"notes" text,
	"payment_method" varchar(20) DEFAULT 'cash' NOT NULL,
	"account_id" uuid REFERENCES "accounts"("id") ON DELETE SET NULL,
	"to_account_id" uuid REFERENCES "accounts"("id") ON DELETE SET NULL,
	"recurring_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "transactions_user_date_idx" ON "transactions" USING btree ("user_id", "transaction_date");
--> statement-breakpoint
CREATE INDEX "transactions_user_type_date_idx" ON "transactions" USING btree ("user_id", "type", "transaction_date");
--> statement-breakpoint
CREATE TABLE "transaction_splits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL REFERENCES "transactions"("id") ON DELETE CASCADE,
	"label" varchar(100) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"is_mine" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"name" varchar(40) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_name_idx" ON "tags" USING btree ("user_id", "name");
--> statement-breakpoint
CREATE TABLE "transaction_tags" (
	"transaction_id" uuid NOT NULL REFERENCES "transactions"("id") ON DELETE CASCADE,
	"tag_id" uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_tags_pk" ON "transaction_tags" USING btree ("transaction_id", "tag_id");
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"transaction_id" uuid REFERENCES "transactions"("id") ON DELETE CASCADE,
	"object_key" text NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"name" varchar(100) NOT NULL,
	"category_id" uuid REFERENCES "categories"("id") ON DELETE SET NULL,
	"amount" numeric(14, 2) NOT NULL,
	"period" varchar(12) DEFAULT 'monthly' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"rollover" boolean DEFAULT false NOT NULL,
	"alert_at" integer DEFAULT 80 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"type" varchar(12) NOT NULL,
	"description" varchar(160) NOT NULL,
	"category" varchar(60) DEFAULT 'Other' NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"cadence" varchar(12) NOT NULL,
	"next_date" date NOT NULL,
	"account_id" uuid REFERENCES "accounts"("id") ON DELETE SET NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recurring_id" uuid NOT NULL REFERENCES "recurring"("id") ON DELETE CASCADE,
	"due_date" date NOT NULL,
	"status" varchar(12) DEFAULT 'pending' NOT NULL,
	"transaction_id" uuid REFERENCES "transactions"("id") ON DELETE SET NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "recurring_occurrences_schedule_due_idx" ON "recurring_occurrences" USING btree ("recurring_id", "due_date");
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"key" varchar(180) NOT NULL,
	"kind" varchar(30) NOT NULL,
	"message" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "alerts_user_key_idx" ON "alerts" USING btree ("user_id", "key");
--> statement-breakpoint
CREATE INDEX "alerts_user_date_idx" ON "alerts" USING btree ("user_id", "created_at");
--> statement-breakpoint

-- Preserve existing expense records in the generalized ledger.
INSERT INTO "transactions" ("user_id", "type", "description", "category", "amount", "transaction_date", "payment_method")
SELECT "user_id", 'expense', "description", "category", "amount", "spent_on", 'cash' FROM "expenses";
--> statement-breakpoint

-- Give each existing user a default cash account and standard categories.
INSERT INTO "accounts" ("user_id", "name", "type", "kind")
SELECT "id", 'Cash', 'cash', 'asset' FROM "users";
--> statement-breakpoint
INSERT INTO "categories" ("user_id", "name", "type", "is_default")
SELECT u."id", c."name", c."type", true
FROM "users" u CROSS JOIN (VALUES ('Food','expense'),('Transport','expense'),('Shopping','expense'),('Bills','expense'),('Health','expense'),('Entertainment','expense'),('Other','expense'),('Salary','income'),('Other income','income')) AS c("name","type");
--> statement-breakpoint
UPDATE "transactions" t SET "category_id" = c."id" FROM "categories" c WHERE t."user_id" = c."user_id" AND t."category" = c."name" AND t."type" = c."type";
--> statement-breakpoint
UPDATE "transactions" t SET "account_id" = a."id" FROM "accounts" a WHERE t."user_id" = a."user_id" AND a."name" = 'Cash';
--> statement-breakpoint
