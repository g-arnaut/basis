import { db } from "@/db";
import { theses, priceHistory, benchmarks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchQuotes } from "@/lib/finnhub";
import { NextResponse } from "next/server";

// Vercel Cron calls this once a day (see vercel.json). It:
// 1. finds every open thesis
// 2. fetches today's price for the stock + its sector ETF + SPY (via
//    Finnhub - see lib/finnhub.ts for why, not Stooq or FMP)
// 3. upserts one price_history row per thesis for today
//
// Protected by CRON_SECRET so this can't be triggered by anyone poking the
// URL — Vercel Cron sends this automatically, you don't set it per-request.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const openTheses = await db.query.theses.findMany({
    where: eq(theses.status, "open"),
    with: { sectorEtf: true, sp500Benchmark: true },
  });

  if (openTheses.length === 0) {
    return NextResponse.json({ ok: true, logged: 0, message: "No open theses" });
  }

  const allTickers = new Set<string>();
  for (const t of openTheses) {
    allTickers.add(t.ticker);
    if (t.sectorEtf) allTickers.add(t.sectorEtf.ticker);
    if (t.sp500Benchmark) allTickers.add(t.sp500Benchmark.ticker);
  }

  const prices = await fetchQuotes([...allTickers]);
  const today = new Date().toISOString().slice(0, 10);

  const results: { thesisId: number; ticker: string; ok: boolean }[] = [];

  for (const t of openTheses) {
    const stockPrice = prices[t.ticker];
    if (stockPrice == null) {
      results.push({ thesisId: t.id, ticker: t.ticker, ok: false });
      continue;
    }
    const sectorEtfPrice = t.sectorEtf ? prices[t.sectorEtf.ticker] : null;
    const sp500Price = t.sp500Benchmark ? prices[t.sp500Benchmark.ticker] : null;

    await db
      .insert(priceHistory)
      .values({
        thesisId: t.id,
        date: today,
        stockPrice: stockPrice.toFixed(4),
        sectorEtfPrice: sectorEtfPrice != null ? sectorEtfPrice.toFixed(4) : null,
        sp500Price: sp500Price != null ? sp500Price.toFixed(4) : null,
      })
      .onConflictDoUpdate({
        target: [priceHistory.thesisId, priceHistory.date],
        set: {
          stockPrice: stockPrice.toFixed(4),
          sectorEtfPrice: sectorEtfPrice != null ? sectorEtfPrice.toFixed(4) : null,
          sp500Price: sp500Price != null ? sp500Price.toFixed(4) : null,
        },
      });

    results.push({ thesisId: t.id, ticker: t.ticker, ok: true });
  }

  return NextResponse.json({
    ok: true,
    date: today,
    logged: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok),
  });
}
