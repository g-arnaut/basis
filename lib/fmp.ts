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
