import "dotenv/config";
import { db } from "./index";
import { theses, benchmarks, priceHistory } from "./schema";
import { eq, and } from "drizzle-orm";
import { fetchQuotes } from "../lib/finnhub";

// One-off: for any thesis created before the entry-date price_history row
// was seeded at creation time, insert that missing row now so alpha has a
// real base to index from instead of showing "—" forever. Safe to re-run —
// skips theses that already have an entry-date row.
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
    if (existing) {
      skipped++;
      continue;
    }

    const tickers = [t.sectorEtf?.ticker, t.sp500Benchmark?.ticker].filter(
      (x): x is string => Boolean(x)
    );
    const prices = tickers.length > 0 ? await fetchQuotes(tickers) : {};

    await db.insert(priceHistory).values({
      thesisId: t.id,
      date: t.entryDate,
      stockPrice: t.entryPrice,
      sectorEtfPrice:
        t.sectorEtf && prices[t.sectorEtf.ticker] != null
          ? prices[t.sectorEtf.ticker]!.toFixed(4)
          : null,
      sp500Price:
        t.sp500Benchmark && prices[t.sp500Benchmark.ticker] != null
          ? prices[t.sp500Benchmark.ticker]!.toFixed(4)
          : null,
    });

    console.log(
      `Backfilled ${t.ticker} (thesis ${t.id}), entry date ${t.entryDate}. ` +
        `Note this uses today's benchmark price, not the historical price on ` +
        `that date, since this only fetches a latest quote, not a historical one.`
    );
    backfilled++;
  }

  console.log(`Done. Backfilled ${backfilled}, already had a row: ${skipped}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
