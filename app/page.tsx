import Link from "next/link";
import { listAllTheses, getPriceHistory } from "@/app/actions/theses";
import { listReports } from "@/app/actions/reports";
import { indexPriceSeries, currentAlpha, benchmarkReturns } from "@/lib/performance";
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
      const benchmarks = benchmarkReturns(indexed);
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
        sectorReturn: benchmarks.sector,
        sp500Return: benchmarks.sp500,
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

  const stats = [
    {
      label: "Average alpha vs S&P",
      value: formatPct(avgAlpha),
      cls: tone(avgAlpha),
    },
    {
      label: "Median alpha vs S&P",
      value: formatPct(medianAlpha),
      cls: tone(medianAlpha),
    },
    {
      label: "Beat the index",
      value: alphaValues.length > 0 ? `${beatCount}/${alphaValues.length}` : "—",
      cls: "text-ink",
    },
    {
      label: "Win rate, closed",
      value:
        closedRows.length > 0 ? `${Math.round((winRows.length / closedRows.length) * 100)}%` : "—",
      cls: "text-ink",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-14">
      <p className="label rise text-brass" style={{ ["--i" as string]: 0 }}>
        Equity desk
      </p>
      <h1
        className="rise mt-4 max-w-2xl font-serif text-[2.6rem] font-medium leading-[1.04] tracking-tight sm:text-6xl"
        style={{ ["--i" as string]: 1 }}
      >
        Right or wrong,{" "}
        <em className="font-normal italic text-forest">measured against the market.</em>
      </h1>
      <p
        className="rise mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-muted"
        style={{ ["--i" as string]: 2 }}
      >
        Equity research notes, and a public record of every call in them, each one held to its
        sector and the S&amp;P 500 over exactly the period it was open.
      </p>

      {rows.length > 0 && (
        <>
          <div className="rise mt-10" style={{ ["--i" as string]: 3 }}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <span className="label text-muted">Book summary</span>
              <PricesAsOf date={latestPriceDate} />
            </div>
            <dl className="grid grid-cols-2 divide-x divide-y divide-rule border border-rule bg-surface shadow-[0_1px_0_0_var(--color-rule)] sm:grid-cols-4 sm:divide-y-0">
              {stats.map((s) => (
                <div key={s.label} className="px-4 py-5">
                  <dt className="label text-muted">{s.label}</dt>
                  <dd className={`font-data mt-3 text-[1.9rem] font-medium leading-none ${s.cls}`}>
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
            <HowMeasured />
          </div>
        </>
      )}

      {rows.length === 0 && (
        <div className="mt-16 border-y border-rule py-16 text-center">
          <p className="font-serif text-xl italic text-muted">No theses yet.</p>
          {admin && (
            <Link href="/theses/new" className="mt-3 inline-block text-link underline">
              Write the first one
            </Link>
          )}
        </div>
      )}

      <ThesisList rows={rows} />

      {reports.length > 0 && (
        <section className="mt-20">
          <div className="flex items-end justify-between border-b border-ink/80 pb-3">
            <h2 className="font-serif text-2xl font-medium tracking-tight">Latest reports</h2>
            <Link href="/reports" className="label text-link hover:underline">
              All reports →
            </Link>
          </div>
          {reports.slice(0, 3).map((r) => (
            <Link
              key={r.id}
              href={`/reports/${r.id}`}
              className="group block border-b border-rule py-5 transition-colors hover:bg-surface"
            >
              <span className="font-data text-xs font-medium text-muted">{r.ticker}</span>
              <h3 className="mt-1 font-serif text-xl font-medium leading-snug tracking-tight group-hover:underline">
                {r.title}
              </h3>
              <p className="mt-1.5 line-clamp-2 max-w-2xl text-sm text-muted">{r.analysis}</p>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
