import Link from "next/link";
import { listAllTheses, getPriceHistory } from "@/app/actions/theses";
import { listReports } from "@/app/actions/reports";
import { indexPriceSeries, currentAlpha } from "@/lib/performance";
import { isAdmin } from "@/lib/auth";
import { ThesisList } from "./thesis-list";
import { HowMeasured } from "./how-measured";
import { PricesAsOf } from "./prices-as-of";

// Prices change daily — never freeze this page at build time.
export const dynamic = "force-dynamic";

function formatPct(n: number | null) {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function tone(n: number | null) {
  if (n == null) return "text-ink";
  return n >= 0 ? "text-gain" : "text-loss";
}

export default async function Home() {
  const allTheses = await listAllTheses();
  const admin = await isAdmin();

  const rows = await Promise.all(
    allTheses.map(async (thesis) => {
      const history = await getPriceHistory(thesis.id);
      const points = history.map((h) => ({
        date: h.date,
        stockPrice: Number(h.stockPrice),
        sectorEtfPrice: h.sectorEtfPrice != null ? Number(h.sectorEtfPrice) : null,
        sp500Price: h.sp500Price != null ? Number(h.sp500Price) : null,
      }));
      const indexed = indexPriceSeries(points);
      const alpha = currentAlpha(indexed);
      const latestPrice =
        history.length > 0 ? Number(history[history.length - 1].stockPrice) : Number(thesis.entryPrice);
      const rawReturn = ((latestPrice - Number(thesis.entryPrice)) / Number(thesis.entryPrice)) * 100;

      return {
        id: thesis.id,
        ticker: thesis.ticker,
        companyName: thesis.companyName,
        entryDate: thesis.entryDate,
        exitDate: thesis.exitDate,
        status: thesis.status,
        writeUp: thesis.writeUp,
        entryPrice: Number(thesis.entryPrice),
        latestPrice,
        rawReturn,
        alphaVsSector: alpha.vsSector,
        alphaVsSp500: alpha.vsSp500,
        sparkline: indexed.map((p) => p.stock),
        latestPriceDate: history.length > 0 ? history[history.length - 1].date : null,
      };
    })
  );

  const latestPriceDate = rows.reduce<string | null>((latest, r) => {
    if (!r.latestPriceDate) return latest;
    if (!latest || r.latestPriceDate > latest) return r.latestPriceDate;
    return latest;
  }, null);

  const reports = await listReports();

  const closedRows = rows.filter((r) => r.status !== "open");
  const winRows = closedRows.filter((r) => r.status === "closed_win");

  const alphaValues = rows.map((r) => r.alphaVsSp500).filter((v): v is number => v != null);
  const sorted = [...alphaValues].sort((a, b) => a - b);
  const avgAlpha = alphaValues.length > 0 ? alphaValues.reduce((a, b) => a + b, 0) / alphaValues.length : null;
  const medianAlpha =
    sorted.length > 0
      ? sorted.length % 2 === 1
        ? sorted[(sorted.length - 1) / 2]
        : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : null;
  const beatCount = alphaValues.filter((v) => v > 0).length;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14">
      <h1 className="max-w-lg text-4xl font-bold tracking-tight sm:text-5xl">
        Right or wrong, measured against the market.
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-muted">
        Equity research notes, and a public record of every call in them,
        each one held to its sector and the S&amp;P 500 over exactly the
        period it was open.
      </p>

      {rows.length > 0 && (
        <>
          <div className="mt-6">
            <PricesAsOf date={latestPriceDate} />
          </div>
          <div className="font-data mt-4 grid grid-cols-2 divide-x divide-y divide-rule border border-rule sm:grid-cols-4 sm:divide-y-0">
            <div className="p-4">
              <p className={`text-2xl font-medium ${tone(avgAlpha)}`}>{formatPct(avgAlpha)}</p>
              <p className="mt-0.5 text-xs text-muted">average, vs S&amp;P</p>
            </div>
            <div className="p-4">
              <p className={`text-2xl font-medium ${tone(medianAlpha)}`}>{formatPct(medianAlpha)}</p>
              <p className="mt-0.5 text-xs text-muted">median, vs S&amp;P</p>
            </div>
            <div className="p-4">
              <p className="text-2xl font-medium text-ink">
                {alphaValues.length > 0 ? `${beatCount}/${alphaValues.length}` : "—"}
              </p>
              <p className="mt-0.5 text-xs text-muted">beat the index</p>
            </div>
            <div className="p-4">
              <p className="text-2xl font-medium text-ink">
                {closedRows.length > 0 ? `${Math.round((winRows.length / closedRows.length) * 100)}%` : "—"}
              </p>
              <p className="mt-0.5 text-xs text-muted">win rate, closed</p>
            </div>
          </div>
          <HowMeasured />
        </>
      )}

      {rows.length === 0 && (
        <div className="mt-16 border-y border-rule py-14 text-center text-muted">
          <p>No theses yet.</p>
          {admin && (
            <Link href="/theses/new" className="mt-2 inline-block text-link underline">
              Write the first one
            </Link>
          )}
        </div>
      )}

      <ThesisList rows={rows} />

      {reports.length > 0 && (
        <section className="mt-16 border-t border-rule pt-8">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-muted">Reports</p>
            <Link href="/reports" className="text-sm text-link hover:underline">
              All reports →
            </Link>
          </div>
          {reports.slice(0, 3).map((r) => (
            <Link
              key={r.id}
              href={`/reports/${r.id}`}
              className="block border-b border-rule py-5 hover:bg-ink/[0.02]"
            >
              <span className="font-data text-sm text-muted">{r.ticker}</span>
              <h3 className="mt-1 font-medium">{r.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{r.analysis}</p>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
