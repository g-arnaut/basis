import "dotenv/config";
import { db } from "./index";
import { theses, benchmarks, priceHistory } from "./schema";
import { eq, and } from "drizzle-orm";
import { fetchQuotes } from "../lib/finnhub";

// One-off: for any thesis whose entry-date price_history row is missing
// entirely, or exists but has a null sector/SPY price (e.g. it was created
// before a working price provider was configured), fetch real benchmark
// prices now so alpha has a real base to index from instead of showing
// "—" forever. Safe to re-run — skips rows that are already complete.
async function main() {
  const allTheses = await db.query.theses.findMany({
    with: { sectorEtf: true, sp500Benchmark: true },
  });

  let backfilled = 0;
  let skipped = 0;

  for (const t of allTheses) {
    const existing = await db.query.priceHistory.findFirst({
      where: and(eq(priceHistory.thesisId, t.id), eq(priceHistory.date, t.entryDate)),
    });
    if (existing && existing.sectorEtfPrice != null && existing.sp500Price != null) {
      skipped++;
      continue;
    }

    const tickers = [t.sectorEtf?.ticker, t.sp500Benchmark?.ticker].filter(
      (x): x is string => Boolean(x)
    );
    const prices = tickers.length > 0 ? await fetchQuotes(tickers) : {};

    const sectorEtfPrice =
      t.sectorEtf && prices[t.sectorEtf.ticker] != null
        ? prices[t.sectorEtf.ticker]!.toFixed(4)
        : null;
    const sp500Price =
      t.sp500Benchmark && prices[t.sp500Benchmark.ticker] != null
        ? prices[t.sp500Benchmark.ticker]!.toFixed(4)
        : null;

    if (existing) {
      await db
        .update(priceHistory)
        .set({ sectorEtfPrice, sp500Price })
        .where(eq(priceHistory.id, existing.id));
    } else {
      await db.insert(priceHistory).values({
        thesisId: t.id,
        date: t.entryDate,
        stockPrice: t.entryPrice,
        sectorEtfPrice,
        sp500Price,
      });
    }

    console.log(
      `Backfilled ${t.ticker} (thesis ${t.id}), entry date ${t.entryDate}. ` +
        `Note this uses today's benchmark price, not the historical price on ` +
        `that date, since this only fetches a latest quote, not a historical one.`
    );
    backfilled++;
  }

  console.log(`Done. Backfilled ${backfilled}, already complete: ${skipped}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
