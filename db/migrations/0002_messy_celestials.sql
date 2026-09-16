CREATE TABLE "company_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticker" varchar(10) NOT NULL,
	"company_name" text NOT NULL,
	"thesis_id" integer,
	"title" text NOT NULL,
	"analysis" text NOT NULL,
	"fiscal_period" text,
	"revenue" numeric(20, 2),
	"net_income" numeric(20, 2),
	"gross_margin" numeric(6, 4),
	"operating_margin" numeric(6, 4),
	"net_margin" numeric(6, 4),
	"free_cash_flow" numeric(20, 2),
	"total_debt" numeric(20, 2),
	"cash" numeric(20, 2),
	"ev_to_ebitda" numeric(8, 2),
	"roe" numeric(6, 4),
	"roic" numeric(6, 4),
	"raw_financials" jsonb,
	"financials_fetched_at" timestamp with time zone,
	"financials_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_reports" ADD CONSTRAINT "company_reports_thesis_id_theses_id_fk" FOREIGN KEY ("thesis_id") REFERENCES "public"."theses"("id") ON DELETE set null ON UPDATE no action;