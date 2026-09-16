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
