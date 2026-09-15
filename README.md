# Basis

Equity research platform. Every thesis tracked against its sector ETF and
the S&P 500, so performance shows alpha, not beta.

## Stack

Next.js (App Router) + TypeScript + Tailwind, Drizzle ORM, Postgres
(Supabase or Vercel Postgres), deployed on Vercel.

## Week 1 checklist

- [x] Repo scaffolded (Next.js + TS + Tailwind)
- [x] Postgres schema drafted: `theses`, `model_versions`, `price_history`,
      `benchmarks`, `journal_entries` (see `db/schema.ts`)
- [ ] Push schema to a real Postgres instance
- [ ] Deploy skeleton live to Vercel
- [ ] Confirm `/api/health` returns `ok: true` in production

## Local setup

```bash
npm install
cp .env.example .env       # fill in DATABASE_URL
npm run db:push            # create tables from db/schema.ts
npm run db:seed            # seed SPY + starter sector ETF tickers
npm run dev
```

Visit `/api/health` — it should return
`{ ok: true, benchmarksSeeded: 8 }` once seeded.

## Getting a Postgres instance (pick one)

**Supabase** (recommended — generous free tier, easy dashboard):
1. New project at supabase.com
2. Settings → Database → copy the **Transaction pooler** connection string
   (port 6543) into `DATABASE_URL`

**Vercel Postgres**: Storage tab in your Vercel project → Create →
Postgres. It injects `DATABASE_URL` (and other vars) automatically once
connected — pull them locally with `vercel env pull .env`.

## Deploying to Vercel

1. Push this repo to GitHub
2. Import it at vercel.com/new
3. Add `DATABASE_URL` (and later `FMP_API_KEY`, `ANTHROPIC_API_KEY`) in
   Project Settings → Environment Variables
4. Deploy. Then run `npm run db:push` and `npm run db:seed` locally (or
   via a one-off Vercel CLI command) against the same `DATABASE_URL` so
   the deployed app has tables + seed data.

## Schema notes

- `benchmarks` is a small reference table (SPY + sector ETF tickers).
  `theses.sectorEtfId` / `sp500BenchmarkId` point into it, so relative
  performance is always computed against explicit benchmark rows, not a
  hardcoded ticker string.
- `price_history` gets one row per (thesis, date) from the daily cron —
  stock price alongside both benchmark prices, so alpha is a query away.
- `model_versions.namedRanges` holds the full SheetJS-parsed named-range
  dump; `wacc` / `terminalGrowth` / `impliedPrice` are pulled out as real
  columns too so you're not reaching into JSON for the headline numbers.
- `kill_criteria` is JSON array of `{ condition, hit, hitDate }` — flip
  `hit` when a criterion is objectively triggered.

## Next up (Phase 1, weeks 2-4)

Thesis CRUD, entry/target price capture, the daily Vercel Cron job
logging price + sector ETF + S&P into `price_history`, and the
relative-performance chart. Protect this phase above all else.
