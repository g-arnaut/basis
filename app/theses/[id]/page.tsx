import Link from "next/link";
import { notFound } from "next/navigation";
import { getThesis, getPriceHistory, getJournalEntries } from "@/app/actions/theses";
import { indexPriceSeries, benchmarkReturns } from "@/lib/performance";
import { isAdmin } from "@/lib/auth";
import { PerformanceChart } from "./performance-chart";
import { KillCriteriaList } from "./kill-criteria";
import { Journal } from "./journal";
import { CloseThesisForm } from "./close-thesis-form";
import { PricesAsOf } from "@/app/prices-as-of";
import { Prose } from "@/app/prose";

// Prices change daily — never freeze this page at build time.
export const dynamic = "force-dynamic";

function formatPct(n: number | null) {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function Glyph({ n }: { n: number | null }) {
  if (n == null || n === 0) return null;
  return (
    <span aria-hidden className="mr-1 text-[8px] leading-none">
      {n > 0 ? "▲" : "▼"}
    </span>
  );
}

function StatRow({
  label,
  value,
  tone,
  glyphOf,
}: {
  label: string;
  value: string;
  tone?: "gain" | "loss";
  glyphOf?: number | null;
}) {
  return (
    <div className="flex items-baseline justify-between border-b border-rule py-2.5 last:border-b-0">
      <p className="text-sm text-muted">{label}</p>
      <p
        className={`font-data text-sm ${
          tone === "gain"
            ? "text-gain"
            : tone === "loss"
              ? "text-loss"
              : "text-ink"
        }`}
      >
        {glyphOf !== undefined && <Glyph n={glyphOf} />}
        {value}
      </p>
    </div>
  );
}

function StatGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label border-b-2 border-ink pb-2 text-forest">{title}</p>
      {children}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="display border-b-2 border-ink pb-2 text-[1.7rem]">{children}</h2>;
}

export default async function ThesisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thesisId = Number(id);
  const thesis = await getThesis(thesisId);
  if (!thesis) notFound();

  const history = await getPriceHistory(thesisId);
  const journalEntries = await getJournalEntries(thesisId);
  const admin = await isAdmin();

  const points = history.map((h) => ({
    date: h.date,
    stockPrice: Number(h.stockPrice),
    sectorEtfPrice: h.sectorEtfPrice != null ? Number(h.sectorEtfPrice) : null,
    sp500Price: h.sp500Price != null ? Number(h.sp500Price) : null,
  }));
  const indexed = indexPriceSeries(points);
  const benchmarks = benchmarkReturns(indexed);
  const latestPrice = history.length > 0 ? Number(history[history.length - 1].stockPrice) : Number(thesis.entryPrice);
  const rawReturn = ((latestPrice - Number(thesis.entryPrice)) / Number(thesis.entryPrice)) * 100;
  const toTarget = ((Number(thesis.targetPrice) - latestPrice) / latestPrice) * 100;
  const latestPriceDate = history.length > 0 ? history[history.length - 1].date : null;

  const tone = (n: number | null): "gain" | "loss" => ((n ?? 0) >= 0 ? "gain" : "loss");

  return (
    <main className="px-6 pb-16 pt-8">
      <Link href="/" className="label text-muted transition-colors hover:text-ink">
        ← All positions
      </Link>

      <header className="rise mt-6" style={{ ["--i" as string]: 0 }}>
        <div className="flex items-end justify-between gap-6">
          <h1 className="display text-[6.5rem] sm:text-[11rem]">{thesis.ticker}</h1>
          {thesis.status !== "open" && (
            <span className="label mb-4 flex-shrink-0 border-2 border-ink px-2.5 py-1 text-ink">
              Closed, {thesis.status.replace("closed_", "")}
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-4 border-t-2 border-ink pt-3">
          <p className="text-xl font-semibold">{thesis.companyName}</p>
          {thesis.sector && <p className="label text-muted">{thesis.sector}</p>}
          <p className="label text-muted">Long</p>
        </div>
      </header>

      <section
        className="rise mt-10 border-2 border-ink bg-surface p-4 sm:p-6"
        style={{ ["--i" as string]: 1 }}
      >
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <p className="label text-muted">Indexed performance, entry = 100</p>
          <PricesAsOf date={latestPriceDate} />
        </div>
        <PerformanceChart
          data={indexed}
          tickerLabel={thesis.ticker}
          sectorLabel={thesis.sectorEtf?.ticker ?? null}
        />
      </section>

      <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rise order-2 space-y-12 md:order-1" style={{ ["--i" as string]: 2 }}>
          <section>
            <SectionHeading>The thesis</SectionHeading>
            <Prose text={thesis.writeUp} className="mt-5" />
          </section>

          <section>
            <SectionHeading>The bear case</SectionHeading>
            <Prose text={thesis.bearCase} className="mt-5 text-ink/80" />
          </section>

          <section>
            <SectionHeading>Journal</SectionHeading>
            <div className="mt-5">
              <Journal thesisId={thesis.id} entries={journalEntries} readOnly={!admin} />
            </div>
          </section>
        </div>

        <aside className="rise order-1 space-y-8 md:order-2 md:sticky md:top-32 md:self-start" style={{ ["--i" as string]: 3 }}>
          <div className="border-2 border-ink bg-surface p-5">
            <div className="space-y-6">
              <StatGroup title="Price">
                <StatRow label="Entry" value={`$${Number(thesis.entryPrice).toFixed(2)}`} />
                <StatRow label="Current" value={`$${latestPrice.toFixed(2)}`} />
                <StatRow label="Target" value={`$${Number(thesis.targetPrice).toFixed(2)}`} />
                <StatRow label="To target" value={formatPct(toTarget)} glyphOf={toTarget} />
              </StatGroup>
              <StatGroup title="Since entry">
                <StatRow
                  label="Return"
                  value={formatPct(rawReturn)}
                  tone={tone(rawReturn)}
                  glyphOf={rawReturn}
                />
                <StatRow
                  label={`${thesis.sectorEtf?.ticker ?? "Sector"} return`}
                  value={formatPct(benchmarks.sector)}
                  tone={tone(benchmarks.sector)}
                  glyphOf={benchmarks.sector}
                />
                <StatRow
                  label="S&P 500 return"
                  value={formatPct(benchmarks.sp500)}
                  tone={tone(benchmarks.sp500)}
                  glyphOf={benchmarks.sp500}
                />
                <StatRow
                  label="Held"
                  value={(() => {
                    const start = new Date(thesis.entryDate);
                    const end = thesis.exitDate ? new Date(thesis.exitDate) : new Date();
                    const days = Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
                    return days < 31 ? `${days}d` : `${Math.round(days / 30.4)}mo`;
                  })()}
                />
              </StatGroup>
            </div>
          </div>

          <div>
            <SectionHeading>What would prove this wrong</SectionHeading>
            <KillCriteriaList
              thesisId={thesis.id}
              criteria={thesis.killCriteria as any}
              readOnly={!admin}
            />
          </div>

          {admin && thesis.status === "open" && (
            <div className="border-t border-rule pt-6">
              <CloseThesisForm thesisId={thesis.id} />
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
