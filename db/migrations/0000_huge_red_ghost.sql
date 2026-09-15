CREATE TYPE "public"."benchmark_type" AS ENUM('broad_market', 'sector_etf');--> statement-breakpoint
CREATE TYPE "public"."journal_entry_type" AS ENUM('initiation', 'update', 'kill_criteria_check', 'model_revision', 'closeout');--> statement-breakpoint
CREATE TYPE "public"."thesis_status" AS ENUM('open', 'closed_win', 'closed_loss', 'closed_flat');--> statement-breakpoint
CREATE TABLE "benchmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticker" varchar(10) NOT NULL,
	"name" text NOT NULL,
	"type" "benchmark_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "benchmarks_ticker_unique" UNIQUE("ticker")
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"thesis_id" integer NOT NULL,
	"entry_type" "journal_entry_type" DEFAULT 'update' NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"thesis_id" integer NOT NULL,
	"version_number" integer NOT NULL,
	"file_name" text NOT NULL,
	"wacc" numeric(6, 4),
	"terminal_growth" numeric(6, 4),
	"implied_price" numeric(12, 4),
	"named_ranges" jsonb DEFAULT '{}' NOT NULL,
	"diff_notes" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"thesis_id" integer NOT NULL,
	"date" date NOT NULL,
	"stock_price" numeric(12, 4) NOT NULL,
	"sector_etf_price" numeric(12, 4),
	"sp500_price" numeric(12, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theses" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticker" varchar(10) NOT NULL,
	"company_name" text NOT NULL,
	"sector" text,
	"sector_etf_id" integer,
	"sp500_benchmark_id" integer,
	"write_up" text NOT NULL,
	"bear_case" text NOT NULL,
	"kill_criteria" jsonb DEFAULT '[]' NOT NULL,
	"entry_price" numeric(12, 4) NOT NULL,
	"entry_date" date NOT NULL,
	"target_price" numeric(12, 4) NOT NULL,
	"status" "thesis_status" DEFAULT 'open' NOT NULL,
	"exit_price" numeric(12, 4),
	"exit_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_thesis_id_theses_id_fk" FOREIGN KEY ("thesis_id") REFERENCES "public"."theses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_versions" ADD CONSTRAINT "model_versions_thesis_id_theses_id_fk" FOREIGN KEY ("thesis_id") REFERENCES "public"."theses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_thesis_id_theses_id_fk" FOREIGN KEY ("thesis_id") REFERENCES "public"."theses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theses" ADD CONSTRAINT "theses_sector_etf_id_benchmarks_id_fk" FOREIGN KEY ("sector_etf_id") REFERENCES "public"."benchmarks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theses" ADD CONSTRAINT "theses_sp500_benchmark_id_benchmarks_id_fk" FOREIGN KEY ("sp500_benchmark_id") REFERENCES "public"."benchmarks"("id") ON DELETE no action ON UPDATE no action;