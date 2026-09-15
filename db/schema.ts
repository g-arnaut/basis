import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  date,
  timestamp,
  jsonb,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

// ---------- enums ----------

export const thesisStatusEnum = pgEnum("thesis_status", [
  "open",
  "closed_win",
  "closed_loss",
  "closed_flat",
]);

export const benchmarkTypeEnum = pgEnum("benchmark_type", [
  "broad_market",
  "sector_etf",
]);

export const journalEntryTypeEnum = pgEnum("journal_entry_type", [
  "initiation",
  "update",
  "kill_criteria_check",
  "model_revision",
  "closeout",
]);

// ---------- benchmarks ----------
// Reference table of tickers used to measure alpha. Seed with SPY (broad
// market) plus whichever sector ETFs your theses need (XLK, XLF, XLE, ...).

export const benchmarks = pgTable("benchmarks", {
  id: serial("id").primaryKey(),
  ticker: varchar("ticker", { length: 10 }).notNull().unique(),
  name: text("name").notNull(),
  type: benchmarkTypeEnum("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ---------- theses ----------

export const theses = pgTable("theses", {
  id: serial("id").primaryKey(),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  companyName: text("company_name").notNull(),
  sector: text("sector"),

  // which benchmarks this thesis is measured against
  sectorEtfId: integer("sector_etf_id").references(() => benchmarks.id),
  sp500BenchmarkId: integer("sp500_benchmark_id").references(
    () => benchmarks.id
  ),

  writeUp: text("write_up").notNull(),
  bearCase: text("bear_case").notNull(),
  // falsifiable "what would prove me wrong" conditions, e.g.
  // [{ condition: "Gross margin falls below 40%", hit: false, hitDate: null }]
  killCriteria: jsonb("kill_criteria").notNull().default("[]"),

  entryPrice: numeric("entry_price", { precision: 12, scale: 4 }).notNull(),
  entryDate: date("entry_date").notNull(),
  targetPrice: numeric("target_price", { precision: 12, scale: 4 }).notNull(),

  status: thesisStatusEnum("status").notNull().default("open"),
  exitPrice: numeric("exit_price", { precision: 12, scale: 4 }),
  exitDate: date("exit_date"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ---------- price_history ----------
// One row per (thesis, date) logged by the daily Vercel Cron job. Stores the
// stock's own price plus its two benchmark prices so relative performance /
// alpha can be computed without re-joining benchmark price series later.

export const priceHistory = pgTable("price_history", {
  id: serial("id").primaryKey(),
  thesisId: integer("thesis_id")
    .references(() => theses.id, { onDelete: "cascade" })
    .notNull(),
  date: date("date").notNull(),

  stockPrice: numeric("stock_price", { precision: 12, scale: 4 }).notNull(),
  sectorEtfPrice: numeric("sector_etf_price", { precision: 12, scale: 4 }),
  sp500Price: numeric("sp500_price", { precision: 12, scale: 4 }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ---------- model_versions ----------
// Each row is one uploaded, parsed .xlsx. Named ranges pulled via SheetJS
// live in namedRanges for flexibility; the four headline outputs are also
// broken out as columns so querying/diffing/charting doesn't require
// reaching into jsonb every time.

export const modelVersions = pgTable("model_versions", {
  id: serial("id").primaryKey(),
  thesisId: integer("thesis_id")
    .references(() => theses.id, { onDelete: "cascade" })
    .notNull(),
  versionNumber: integer("version_number").notNull(),
  fileName: text("file_name").notNull(),

  wacc: numeric("wacc", { precision: 6, scale: 4 }),
  terminalGrowth: numeric("terminal_growth", { precision: 6, scale: 4 }),
  impliedPrice: numeric("implied_price", { precision: 12, scale: 4 }),

  // full set of named ranges pulled from the workbook, e.g.
  // { WACC: 0.091, TerminalGrowth: 0.03, ImpliedPrice: 142.50, ... }
  namedRanges: jsonb("named_ranges").notNull().default("{}"),

  // human-readable diff vs. the prior version for this thesis, e.g.
  // "Cut terminal growth 4% -> 3%, implied price -8%"
  diffNotes: text("diff_notes"),

  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ---------- journal_entries ----------

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  thesisId: integer("thesis_id")
    .references(() => theses.id, { onDelete: "cascade" })
    .notNull(),
  entryType: journalEntryTypeEnum("entry_type").notNull().default("update"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
