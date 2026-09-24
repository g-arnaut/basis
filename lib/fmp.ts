// Pulls financial statement highlights from Financial Modeling Prep, for
// company reports (daily price quotes live in lib/finnhub.ts instead - see
// that file for why). Uses FMP's current "stable" API
// (financialmodelingprep.com/stable/..., symbol passed as a query param) —
// their older /api/v3/ paths are a legacy tier not available to accounts
// created after Aug 2025 and return a hard "Legacy Endpoint" error,
// confirmed by testing directly against a real key. Field names below are
// also confirmed against real responses, not guessed from docs.

const FMP_BASE = "https://financialmodelingprep.com/stable";

export type FetchedFinancials = {
  fiscalPeriod: string | null;
  revenue: number | null;
  netIncome: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  freeCashFlow: number | null;
  totalDebt: number | null;
  cash: number | null;
  evToEbitda: number | null;
  roe: number | null;
  roic: number | null;
  raw: unknown;
};

async function fmpGet(path: string): Promise<unknown> {
  const key = process.env.FMP_API_KEY;
  if (!key) throw new Error("FMP_API_KEY is not set");

  const url = `${FMP_BASE}${path}${path.includes("?") ? "&" : "?"}apikey=${key}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`FMP request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

function firstOf(value: unknown): Record<string, unknown> | null {
  return Array.isArray(value) && value.length > 0 ? (value[0] as Record<string, unknown>) : null;
}

function num(obj: Record<string, unknown> | null, key: string): number | null {
  if (!obj) return null;
  const v = obj[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export async function fetchCompanyFinancials(ticker: string): Promise<FetchedFinancials> {
  if (!process.env.FMP_API_KEY) {
    throw new Error("FMP_API_KEY is not set");
  }

  const symbol = ticker.toUpperCase();

  // income-statement no longer carries margin ratios (moved to `ratios`)
  // or ROE/ROIC (moved to `key-metrics`) under the stable API — five
  // endpoints now, not four.
  const [incomeRes, balanceRes, cashFlowRes, ratiosRes, keyMetricsRes] = await Promise.all([
    fmpGet(`/income-statement?symbol=${symbol}&limit=1`).catch((e) => ({ __error: String(e) })),
    fmpGet(`/balance-sheet-statement?symbol=${symbol}&limit=1`).catch((e) => ({ __error: String(e) })),
    fmpGet(`/cash-flow-statement?symbol=${symbol}&limit=1`).catch((e) => ({ __error: String(e) })),
    fmpGet(`/ratios?symbol=${symbol}&limit=1`).catch((e) => ({ __error: String(e) })),
    fmpGet(`/key-metrics?symbol=${symbol}&limit=1`).catch((e) => ({ __error: String(e) })),
  ]);

  const inc = firstOf(incomeRes);
  const bal = firstOf(balanceRes);
  const cf = firstOf(cashFlowRes);
  const rat = firstOf(ratiosRes);
  const km = firstOf(keyMetricsRes);

  // individual endpoints tolerate partial failure (one bad endpoint
  // shouldn't blank out the rest), but if every single one failed this
  // was a total outage/bad key, not a partial pull — surface it as an
  // error instead of silently saving an all-null financials snapshot
  if (!inc && !bal && !cf && !rat && !km) {
    throw new Error("FMP returned no usable data for any endpoint");
  }

  return {
    fiscalPeriod: (inc?.date as string) ?? null,
    revenue: num(inc, "revenue"),
    netIncome: num(inc, "netIncome"),
    grossMargin: num(rat, "grossProfitMargin"),
    operatingMargin: num(rat, "operatingProfitMargin"),
    netMargin: num(rat, "netProfitMargin"),
    freeCashFlow: num(cf, "freeCashFlow"),
    totalDebt: num(bal, "totalDebt"),
    cash: num(bal, "cashAndCashEquivalents"),
    evToEbitda: num(rat, "enterpriseValueMultiple"),
    roe: num(km, "returnOnEquity"),
    roic: num(km, "returnOnCapitalEmployed"),
    raw: {
      income: incomeRes,
      balance: balanceRes,
      cashFlow: cashFlowRes,
      ratios: ratiosRes,
      keyMetrics: keyMetricsRes,
    },
  };
}

// True historical close for one ticker on one date - confirmed free for
// SPY and individual stocks like AAPL, but FMP blocks an unpredictable set
// of symbols (most sector ETFs, but also some ordinary stocks like MCD)
// behind a "Premium Query Parameter" error even on this endpoint. Callers
// should treat a null return as "try a latest-quote approximation instead"
// (see fetchQuotes in lib/finnhub.ts), not as a hard failure.
export async function fetchHistoricalPrice(
  ticker: string,
  date: string
): Promise<number | null> {
  const key = process.env.FMP_API_KEY;
  if (!key) return null;

  try {
    const symbol = ticker.toUpperCase();
    const url = `${FMP_BASE}/historical-price-eod/light?symbol=${symbol}&from=${date}&to=${date}&apikey=${key}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    const data: unknown = await res.json();
    const row = firstOf(data);
    return num(row, "price");
  } catch {
    return null;
  }
}
