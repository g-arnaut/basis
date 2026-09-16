ALTER TABLE "company_reports" ADD COLUMN "pdf_url" text;--> statement-breakpoint
ALTER TABLE "company_reports" ADD COLUMN "pdf_file_name" text;--> statement-breakpoint
ALTER TABLE "company_reports" ADD COLUMN "pdf_uploaded_at" timestamp with time zone;