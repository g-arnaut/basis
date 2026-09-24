// Latest quote for one or more tickers, used for daily price tracking.
// FMP's free tier blocks quotes for nearly every ETF (confirmed by testing
// all 7 sector ETFs this app uses, plus other major ones - only SPY
// worked) and even blocked some individual stocks unpredictably. Finnhub's
// free tier has no such restriction - tested clean against every sector
// ETF, SPY, and multiple individual stocks.

const FINNHUB_BASE = "https://finnhub.io/api/v1";

// Deliberately never throws: callers (the price cron, thesis creation)
// treat a missing price as "log it as null and move on," not a hard
// failure.
export async function fetchQuotes(
  tickers: string[]
): Promise<Record<string, number | null>> {
  const result: Record<string, number | null> = {};
  for (const t of tickers) result[t.toUpperCase()] = null;
  if (tickers.length === 0) return result;

  const key = process.env.FINNHUB_API_KEY;
  if (!key) return result;

  await Promise.all(
    tickers.map(async (ticker) => {
      const symbol = ticker.toUpperCase();
      try {
        const url = `${FINNHUB_BASE}/quote?symbol=${symbol}&token=${key}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;

        const data: unknown = await res.json();
        if (typeof data !== "object" || data === null) return;
        const price = (data as Record<string, unknown>).c;

        // Finnhub returns c: 0 (not an error status) for an unknown
        // symbol, so a zero price means "no data," never a real quote.
        if (typeof price === "number" && Number.isFinite(price) && price > 0) {
          result[symbol] = price;
        }
      } catch {
        // best-effort — leave this ticker null rather than throw
      }
    })
  );

  return result;
}
