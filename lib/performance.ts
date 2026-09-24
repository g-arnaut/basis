// Indexes a price series to 100 at its first point, so stock vs. sector ETF
// vs. S&P 500 can be plotted on the same axis regardless of share price —
// this is the chart that makes alpha visible at a glance.

export type PricePoint = {
  date: string;
  stockPrice: number;
  sectorEtfPrice: number | null;
  sp500Price: number | null;
};

export type IndexedPoint = {
  date: string;
  stock: number;
  sectorEtf: number | null;
  sp500: number | null;
};

export function indexPriceSeries(points: PricePoint[]): IndexedPoint[] {
  if (points.length === 0) return [];

  const base = points[0];
  const sectorBase = base.sectorEtfPrice;
  const sp500Base = base.sp500Price;

  return points.map((p) => ({
    date: p.date,
    stock: (p.stockPrice / base.stockPrice) * 100,
    sectorEtf:
      sectorBase != null && p.sectorEtfPrice != null
        ? (p.sectorEtfPrice / sectorBase) * 100
        : null,
    sp500:
      sp500Base != null && p.sp500Price != null
        ? (p.sp500Price / sp500Base) * 100
        : null,
  }));
}

// Simple point-in-time alpha: thesis return minus benchmark return, as of
// the most recent price observation.
export function currentAlpha(indexed: IndexedPoint[]): {
  vsSector: number | null;
  vsSp500: number | null;
} {
  if (indexed.length === 0) return { vsSector: null, vsSp500: null };
  const latest = indexed[indexed.length - 1];
  const stockReturn = latest.stock - 100;

  return {
    vsSector: latest.sectorEtf != null ? stockReturn - (latest.sectorEtf - 100) : null,
    vsSp500: latest.sp500 != null ? stockReturn - (latest.sp500 - 100) : null,
  };
}

// The benchmarks' own indexed return over the same period, so the UI can
// show "stock X%, sector Y%, S&P Z%" side by side and let the reader do
// the alpha subtraction themselves, instead of only showing the already-
// computed differential (which reads ambiguously - "vs sector +1.3%" can
// look like it's describing the sector's own move, not an outperformance).
export function benchmarkReturns(indexed: IndexedPoint[]): {
  sector: number | null;
  sp500: number | null;
} {
  if (indexed.length === 0) return { sector: null, sp500: null };
  const latest = indexed[indexed.length - 1];
  return {
    sector: latest.sectorEtf != null ? latest.sectorEtf - 100 : null,
    sp500: latest.sp500 != null ? latest.sp500 - 100 : null,
  };
}

// Weekday count between a logged price date and now, ignoring market
// holidays (the app has no holiday calendar, so this matches the cron's own
// weekdays-only schedule rather than pretending to be more precise than it
// is). Used to flag stale prices, not to compute anything financial.
export function tradingDaysSince(dateStr: string): number {
  const start = new Date(`${dateStr}T00:00:00Z`);
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  let count = 0;
  const cursor = new Date(start);
  while (cursor < today) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}
