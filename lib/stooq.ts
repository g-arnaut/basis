// Free, unauthenticated end-of-day-ish quotes from Stooq — same source
// already used by the Stock Scout Agent, so no new API key to manage.
// Good enough for tracking a thesis's relative performance; not a feed
// you'd want for anything execution-related.

export async function fetchStooqPrice(ticker: string): Promise<number | null> {
  const symbol = `${ticker.toLowerCase()}.us`;
  const url = `https://stooq.com/q/l/?s=${symbol}&f=sd2t2ohlcv&h&e=csv`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    const text = await res.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) return null;

    // Header: Symbol,Date,Time,Open,High,Low,Close,Volume
    const row = lines[1].split(",");
    const close = parseFloat(row[6]);
    return Number.isFinite(close) ? close : null;
  } catch {
    return null;
  }
}

export async function fetchStooqPrices(
  tickers: string[]
): Promise<Record<string, number | null>> {
  const results = await Promise.all(
    tickers.map(async (ticker) => [ticker, await fetchStooqPrice(ticker)] as const)
  );
  return Object.fromEntries(results);
}
