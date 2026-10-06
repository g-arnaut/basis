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
          tone === "gain" ? "text-gain" : tone === "loss" ? "text-loss" : "text-ink"
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
      <p className="label border-b border-ink/80 pb-2 text-muted">{title}</p>
      {children}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="label border-b border-ink/80 pb-2 text-muted">{children}</h2>
  );
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
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <Link href="/" className="label text-muted transition-colors hover:text-ink">
        ← All positions
      </Link>

      <header className="rise mt-6 flex items-start justify-between gap-6" style={{ ["--i" as string]: 0 }}>
        <div>
          <div className="flex items-center gap-3">
            <span className="font-data rounded-sm border border-ink/30 px-2 py-0.5 text-xs font-medium tracking-wide">
              {thesis.ticker}
            </span>
            {thesis.sector && <span className="label text-muted">{thesis.sector}</span>}
            <span className="label text-muted">· Long</span>
          </div>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">
            {thesis.companyName}
          </h1>
        </div>
        {thesis.status !== "open" && (
          <span className="label mt-1 flex-shrink-0 rounded-sm border border-ink/30 px-2.5 py-1 text-ink">
            Closed, {thesis.status.replace("closed_", "")}
          </span>
        )}
      </header>

      <section
        className="rise mt-10 border border-rule bg-surface p-4 shadow-[0_1px_0_0_var(--color-rule)] sm:p-6"
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
            <p className="prose-research mt-5 whitespace-pre-wrap">{thesis.writeUp}</p>
          </section>

          <section>
            <SectionHeading>The bear case</SectionHeading>
            <p className="prose-research mt-5 whitespace-pre-wrap text-ink/80">{thesis.bearCase}</p>
          </section>

          <section>
            <SectionHeading>Journal</SectionHeading>
            <div className="mt-5">
              <Journal thesisId={thesis.id} entries={journalEntries} readOnly={!admin} />
            </div>
          </section>
        </div>

        <aside className="rise order-1 space-y-8 md:order-2 md:sticky md:top-32 md:self-start" style={{ ["--i" as string]: 3 }}>
          <div className="border border-rule bg-surface p-5 shadow-[0_1px_0_0_var(--color-rule)]">
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
