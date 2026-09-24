import { fetchHistoricalPrice } from "./fmp";
import { fetchQuotes } from "./finnhub";

// Best-effort price for each ticker on a specific (possibly backdated)
// date - used only when seeding/backfilling a thesis's entry-date
// price_history row, not by the daily cron (which always wants "today,"
// and a latest quote already answers that correctly).
//
// Tries a true historical close first (free on FMP for some symbols, see
// fetchHistoricalPrice), and only falls back to a Finnhub latest-quote
// approximation for tickers FMP blocks. That fallback is only accurate
// when `date` is today or very recent - there's no free source for a true
// historical price on an arbitrarily old backdated entry right now.
export async function fetchBenchmarkPricesForDate(
  tickers: string[],
  date: string
): Promise<Record<string, number | null>> {
  const result: Record<string, number | null> = {};
  if (tickers.length === 0) return result;

  const historical = await Promise.all(
    tickers.map(async (t) => [t.toUpperCase(), await fetchHistoricalPrice(t, date)] as const)
  );
  for (const [ticker, price] of historical) result[ticker] = price;

  const missing = tickers.filter((t) => result[t.toUpperCase()] == null);
  if (missing.length > 0) {
    const latest = await fetchQuotes(missing);
    for (const ticker of missing) {
      const symbol = ticker.toUpperCase();
      if (latest[symbol] != null) result[symbol] = latest[symbol];
    }
  }

  return result;
}
