// Pulls a company's latest financial statement highlights from Financial
// Modeling Prep. Built against FMP's v3 REST API as documented, but not
// tested against a live key from this environment (no network access to
// external APIs here) — field names below are my best-effort mapping of
// their documented response shape. If a number comes back null after a
// real fetch, check `raw` (stored as rawFinancials on the report) for the
// actual field names before assuming the pull failed outright.

const FMP_BASE = "https://financialmodelingprep.com/api/v3";

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

  const [incomeRes, balanceRes, cashFlowRes, ratiosRes] = await Promise.all([
    fmpGet(`/income-statement/${symbol}?limit=1`).catch((e) => ({ __error: String(e) })),
    fmpGet(`/balance-sheet-statement/${symbol}?limit=1`).catch((e) => ({ __error: String(e) })),
    fmpGet(`/cash-flow-statement/${symbol}?limit=1`).catch((e) => ({ __error: String(e) })),
    fmpGet(`/ratios/${symbol}?limit=1`).catch((e) => ({ __error: String(e) })),
  ]);

  const inc = firstOf(incomeRes);
  const bal = firstOf(balanceRes);
  const cf = firstOf(cashFlowRes);
  const rat = firstOf(ratiosRes);

  // individual endpoints tolerate partial failure (one bad endpoint
  // shouldn't blank out the rest), but if every single one failed this
  // was a total outage/bad key, not a partial pull — surface it as an
  // error instead of silently saving an all-null financials snapshot
  if (!inc && !bal && !cf && !rat) {
    throw new Error("FMP returned no usable data for any endpoint");
  }

  return {
    fiscalPeriod: (inc?.date as string) ?? null,
    revenue: num(inc, "revenue"),
    netIncome: num(inc, "netIncome"),
    grossMargin: num(inc, "grossProfitRatio"),
    operatingMargin: num(inc, "operatingIncomeRatio"),
    netMargin: num(inc, "netIncomeRatio"),
    freeCashFlow: num(cf, "freeCashFlow"),
    totalDebt: num(bal, "totalDebt"),
    cash: num(bal, "cashAndCashEquivalents"),
    evToEbitda: num(rat, "enterpriseValueMultiple"),
    roe: num(rat, "returnOnEquity"),
    roic: num(rat, "returnOnCapitalEmployed"),
    raw: { income: incomeRes, balance: balanceRes, cashFlow: cashFlowRes, ratios: ratiosRes },
  };
}

// Latest quote for one or more tickers, used for daily price tracking
// (replaces the old Stooq integration, whose free CSV endpoint stopped
// working — see FMP's /quote endpoint docs). Deliberately never throws:
// callers (the price cron, thesis creation) treat a missing price as
// "log it as null and move on," not a hard failure, same contract the
// old fetchStooqPrices had.
export async function fetchQuotes(
  tickers: string[]
): Promise<Record<string, number | null>> {
  const result: Record<string, number | null> = {};
  for (const t of tickers) result[t.toUpperCase()] = null;
  if (tickers.length === 0) return result;

  const key = process.env.FMP_API_KEY;
  if (!key) return result;

  try {
    const symbols = tickers.map((t) => t.toUpperCase()).join(",");
    const url = `${FMP_BASE}/quote/${symbols}?apikey=${key}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return result;

    const data: unknown = await res.json();
    if (!Array.isArray(data)) return result;

    for (const row of data) {
      if (typeof row !== "object" || row === null) continue;
      const symbol = (row as Record<string, unknown>).symbol;
      const price = (row as Record<string, unknown>).price;
      if (typeof symbol === "string" && typeof price === "number" && Number.isFinite(price)) {
        result[symbol.toUpperCase()] = price;
      }
    }
  } catch {
    // best-effort — leave everything null rather than throw
  }

  return result;
}
