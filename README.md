# Basis

Equity research platform. Every thesis tracked against its sector ETF and
the S&P 500, so performance shows alpha, not beta.

## Stack

Next.js (App Router) + TypeScript + Tailwind, Drizzle ORM, Postgres
(Supabase), deployed on Vercel. Prices via Stooq (free, no API key).

## Status

- [x] Week 1 — repo, schema, skeleton deployed
- [x] Phase 1 — thesis CRUD, kill criteria, journal, daily price cron,
      relative-performance chart
- [x] Public site — password-gated write access, track record stats,
      public read-only view of every thesis
- [x] Company reports — written analysis + auto-pulled financials
      (income statement / balance sheet / cash flow / ratios), optionally
      linked to a thesis
- [ ] Phase 2 remainder — Excel model ingestion/versioning
- [ ] Phase 3 — Stock Scout signal feed
- [ ] Phase 4 — fuller scorecard dashboard (hit rate is already on the
      homepage; best/worst calls still to come)

## Local setup

```bash
npm install
cp .env.example .env       # fill in DATABASE_URL, CRON_SECRET, ADMIN_PASSWORD, FMP_API_KEY
npm run db:push            # apply schema
npm run db:seed            # seed SPY + starter sector ETF tickers
npm run dev
```

Visit `/api/health` to confirm the DB connection. Go to `/admin/login`
and sign in with your `ADMIN_PASSWORD` to see the "+ New thesis" button
and write controls — logged out, you see exactly what a visitor would.

## Setting up company reports (Financial Modeling Prep)

1. Sign up at financialmodelingprep.com (free tier works for this)
2. Get your API key from the dashboard
3. Add it as `FMP_API_KEY` in `.env` (locally) and in Vercel's
   Environment Variables (for production)

Without a key, `/reports/new` still works — the report saves with your
written analysis, the financials panel just shows "unavailable." Once a
key is set, use "Refresh financials" on any existing report to pull it in
without re-entering the analysis.

**Field-mapping caveat:** the parsing in `lib/fmp.ts` was written against
FMP's documented API shape, not tested against a live key (no live
network access in the environment that built this). If numbers come back
null with a real key, the pull itself likely worked — check
`rawFinancials` on the report row in the database for FMP's actual field
names and adjust the mapping in `lib/fmp.ts` accordingly. Nothing is lost
in the meantime since the raw response is always stored.

## Deploying changes

```bash
git add .
git commit -m "Company reports + design pass"
git push
```

Vercel redeploys automatically on push to `main`. Environment variables
to have set in the Vercel dashboard (**Settings → Environment
Variables**): `DATABASE_URL`, `CRON_SECRET`, `ADMIN_PASSWORD`, and now
`FMP_API_KEY`. Cron itself needs no manual setup — `vercel.json` defines
the schedule and Vercel picks it up on deploy.

If you ever reset your Supabase database password, update `DATABASE_URL`
in **both** your local `.env` and Vercel's Environment Variables, then
redeploy.

## How the public/private split works

- Every mutating action (`createThesis`, `addJournalEntry`,
  `toggleKillCriterion`, `closeThesis`, `createReport`,
  `refreshFinancials`) calls `requireAdmin()` first — even if someone
  bypassed the UI and called the action directly, it's still blocked
  without the right cookie.
- `isAdmin()` checks a cookie set only by `/admin/login`, which checks
  the password against `ADMIN_PASSWORD`. No `ADMIN_PASSWORD` set = no
  admin access is possible, ever — the site defaults safe.
- The UI hides write affordances entirely when logged out (no "+ New
  thesis"/"New report" buttons, no kill-criteria checkboxes, no journal
  input, no close-thesis form, no refresh-financials button) rather than
  showing them disabled — a logged-out visitor sees exactly the
  read-only public record.

## How the alpha tracking works

- `benchmarks` holds SPY plus sector ETF tickers. Each thesis points at one
  sector ETF (`sectorEtfId`) and always gets SPY as `sp500BenchmarkId`
  automatically on creation.
- The daily cron (`/api/cron/prices`) fetches the stock's price and both
  benchmark prices from Stooq for every *open* thesis, and upserts one row
  per thesis per day into `price_history` (safe to run more than once a
  day — it updates rather than duplicates).
- `lib/performance.ts` indexes the stock and both benchmarks to 100 at
  entry date, so they plot on the same chart regardless of share price.
  Where your line sits above the benchmark lines *is* the alpha. The
  homepage sparklines use the same indexed stock series.
- Kill criteria live as JSON on each thesis (`condition`, `hit`,
  `hitDate`). Checking one off in the UI logs a journal entry
  automatically — that's the "flags when objectively hit" behavior from
  the brief, done manually for now rather than auto-detected.
- The homepage stats (average / median / beat-rate / win-rate) are
  computed live from whatever theses exist — no separate scorecard table
  yet, that's the fuller Phase 4 dashboard still to come.
- Closing a thesis requires a written reflection, not just an exit price
  — stored as a `closeout` journal entry.

## How company reports work

- A report is independent of a thesis — you can write one on a company
  you're only watching. `thesisId` is nullable; setting it shows a
  "Position TICKER open/closed →" link on the report page.
- On creation, `lib/fmp.ts` pulls income statement, balance sheet, cash
  flow, and ratios in parallel and extracts a handful of headline figures
  (revenue, margins, FCF, debt, cash, EV/EBITDA, ROE, ROIC) into real
  columns on `company_reports`, plus the full raw response into
  `rawFinancials` as a fallback/debugging reference.
- If any of the four calls fails (bad key, rate limit, delisted ticker),
  the report still saves — `financialsError` records what went wrong,
  and the UI shows "unavailable" instead of the stat panel.

## Site structure — desks

The nav is organized as "desks": Equity (the real, populated one — home
page), Credit and Derivatives (empty placeholder pages at `/credit` and
`/derivatives`, ready for a schema and real pages once there's an actual
position to track, deliberately not built speculatively ahead of one),
and Reports (independent of desks, since a report doesn't require a
position). The header's ticker strip shows real data — current price and
return since entry for every open thesis — not a live feed.

## Known limitations (fine for now, revisit later)

- Stooq occasionally has gaps or delisted-ticker issues — the cron logs
  which tickers failed each run (`failed` array in the JSON response) so
  you can investigate rather than silently missing data.
- FMP field mapping is unverified against a live key — see the caveat
  above.
- Single shared password, not real user accounts — fine for a one-owner
  site, wouldn't scale to multiple contributors.
- No `direction` field yet — every thesis is implicitly long. If you add
  a short position later (you've done long/short before), the schema and
  return math both assume price-up-is-good and would need a small change
  first.
- Credit and derivatives aren't modeled — the schema (entry/target price,
  sector ETF benchmark) is equity-shaped. Treat that as a separate future
  module with its own table and page, built when there's a real position
  to put in it, not speculatively ahead of one.
