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

  const tone = (n: number | null) =>
    n == null ? "text-ink" : n >= 0 ? "text-gain" : "text-loss";

  const ledger = [
    { label: "Median alpha vs S&P", value: formatPct(medianAlpha), cls: tone(medianAlpha) },
    {
      label: "Beat the index",
      value: alphaValues.length > 0 ? `${beatCount} of ${alphaValues.length}` : "—",
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
    <main>
      <section
        className={`grid grid-cols-1 ${rows.length > 0 ? "lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]" : ""}`}
      >
        <div className="px-6 pb-14 pt-12 sm:pt-16 lg:pr-14">
          <p className="label rise text-forest" style={{ ["--i" as string]: 0 }}>
            Equity desk · public record
          </p>
          <h1
            className="display rise mt-5 text-[3.4rem] sm:text-[5rem] lg:text-[6.3rem]"
            style={{ ["--i" as string]: 1 }}
          >
            Every call on the record, <span className="hl">scored against the market.</span>
          </h1>
          <p
            className="rise mt-8 max-w-md font-serif text-[1.2rem] leading-[1.5] text-ink/80"
            style={{ ["--i" as string]: 2 }}
          >
            Equity research notes, and a public record of every call in them, each one held to its
            sector and the S&amp;P 500 over exactly the period it was open.
          </p>
          {rows.length > 0 && (
            <div className="rise mt-6" style={{ ["--i" as string]: 3 }}>
              <HowMeasured />
            </div>
          )}
        </div>

        {rows.length > 0 && (
          <aside
            className="rise self-start border-2 border-ink bg-surface px-7 py-8 sm:px-9 lg:mr-6 lg:mt-16"
            style={{ ["--i" as string]: 2 }}
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className="label text-forest">Book summary</span>
              <PricesAsOf date={latestPriceDate} />
            </div>

            <div className="mt-8">
              <p className="label text-muted">Average alpha vs S&amp;P</p>
              <p className={`display mt-2 text-[5.2rem] leading-none sm:text-[6.4rem] ${tone(avgAlpha)}`}>
                {formatPct(avgAlpha)}
              </p>
            </div>

            <dl className="mt-8 border-t-2 border-ink">
              {ledger.map((l) => (
                <div
                  key={l.label}
                  className="flex items-baseline justify-between gap-4 border-b border-rule py-3.5"
                >
                  <dt className="text-sm text-muted">{l.label}</dt>
                  <dd className={`font-data text-xl ${l.cls}`}>{l.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        )}
      </section>

      <div className="px-6 pb-16">
        {rows.length === 0 && (
          <div className="border-y-2 border-ink py-16">
            <p className="font-serif text-2xl italic text-muted">No theses yet.</p>
            {admin && (
              <Link href="/theses/new" className="mt-3 inline-block font-medium text-forest underline">
                Write the first one
              </Link>
            )}
          </div>
        )}

        <ThesisList rows={rows} />

        {reports.length > 0 && (
          <section className="mt-20">
            <div className="flex items-end justify-between border-b-2 border-ink pb-3">
              <h2 className="display text-[2.4rem]">Latest reports</h2>
              <Link href="/reports" className="label text-forest hover:underline">
                All reports →
              </Link>
            </div>
            {reports.slice(0, 3).map((r) => (
              <Link
                key={r.id}
                href={`/reports/${r.id}`}
                className="group grid gap-x-8 border-b border-rule py-6 transition-colors hover:bg-surface md:grid-cols-[7rem_minmax(0,1fr)]"
              >
                <span className="display text-[2rem] text-ink/80">{r.ticker}</span>
                <div>
                  <h3 className="font-serif text-2xl font-semibold leading-snug group-hover:underline">
                    {r.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 max-w-2xl text-sm text-muted">{r.analysis}</p>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
