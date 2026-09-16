import { relations } from "drizzle-orm";
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
  unique,
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

export const priceHistory = pgTable(
  "price_history",
  {
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
  },
  (table) => [
    // one row per thesis per day — lets the daily cron upsert safely
    // instead of accumulating duplicates if it ever runs twice
    unique("price_history_thesis_date_unique").on(table.thesisId, table.date),
  ]
);

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

// ---------- company_reports ----------
// A deeper company profile: written analysis plus a pulled financial
// snapshot (income statement / balance sheet / cash flow / ratios
// highlights). Optionally linked to a thesis, but doesn't require one —
// you can write a report on a company you're only watching.

export const companyReports = pgTable("company_reports", {
  id: serial("id").primaryKey(),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  companyName: text("company_name").notNull(),
  thesisId: integer("thesis_id").references(() => theses.id, { onDelete: "set null" }),

  title: text("title").notNull(),
  analysis: text("analysis").notNull(),

  // pulled financial snapshot — the headline figures as real columns so
  // they're easy to display/query, plus the raw API response in case a
  // field mapping needs fixing later without re-fetching
  fiscalPeriod: text("fiscal_period"),
  revenue: numeric("revenue", { precision: 20, scale: 2 }),
  netIncome: numeric("net_income", { precision: 20, scale: 2 }),
  grossMargin: numeric("gross_margin", { precision: 6, scale: 4 }),
  operatingMargin: numeric("operating_margin", { precision: 6, scale: 4 }),
  netMargin: numeric("net_margin", { precision: 6, scale: 4 }),
  freeCashFlow: numeric("free_cash_flow", { precision: 20, scale: 2 }),
  totalDebt: numeric("total_debt", { precision: 20, scale: 2 }),
  cash: numeric("cash", { precision: 20, scale: 2 }),
  evToEbitda: numeric("ev_to_ebitda", { precision: 8, scale: 2 }),
  roe: numeric("roe", { precision: 6, scale: 4 }),
  roic: numeric("roic", { precision: 6, scale: 4 }),

  rawFinancials: jsonb("raw_financials"),
  financialsFetchedAt: timestamp("financials_fetched_at", { withTimezone: true }),
  financialsError: text("financials_error"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- relations ----------
// Lets db.query.theses.findFirst({ with: { sectorEtf: true, ... } }) work.

export const thesesRelations = relations(theses, ({ one, many }) => ({
  sectorEtf: one(benchmarks, {
    fields: [theses.sectorEtfId],
    references: [benchmarks.id],
    relationName: "sectorEtf",
  }),
  sp500Benchmark: one(benchmarks, {
    fields: [theses.sp500BenchmarkId],
    references: [benchmarks.id],
    relationName: "sp500Benchmark",
  }),
  priceHistory: many(priceHistory),
  modelVersions: many(modelVersions),
  journalEntries: many(journalEntries),
  companyReports: many(companyReports),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  thesis: one(theses, {
    fields: [priceHistory.thesisId],
    references: [theses.id],
  }),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  thesis: one(theses, {
    fields: [journalEntries.thesisId],
    references: [theses.id],
  }),
}));

export const modelVersionsRelations = relations(modelVersions, ({ one }) => ({
  thesis: one(theses, {
    fields: [modelVersions.thesisId],
    references: [theses.id],
  }),
}));

export const companyReportsRelations = relations(companyReports, ({ one }) => ({
  thesis: one(theses, {
    fields: [companyReports.thesisId],
    references: [theses.id],
  }),
}));
