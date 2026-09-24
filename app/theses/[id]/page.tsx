import Link from "next/link";
import { notFound } from "next/navigation";
import { getThesis, getPriceHistory, getJournalEntries } from "@/app/actions/theses";
import { indexPriceSeries, currentAlpha } from "@/lib/performance";
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

function StatRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "gain" | "loss";
}) {
  return (
    <div className="flex items-baseline justify-between border-b border-rule py-2.5 last:border-b-0">
      <p className="text-sm text-muted">{label}</p>
      <p
        className={`font-data text-sm ${
          tone === "gain" ? "text-gain" : tone === "loss" ? "text-loss" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
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
  const alpha = currentAlpha(indexed);
  const latestPrice = history.length > 0 ? Number(history[history.length - 1].stockPrice) : Number(thesis.entryPrice);
  const rawReturn = ((latestPrice - Number(thesis.entryPrice)) / Number(thesis.entryPrice)) * 100;
  const toTarget = ((Number(thesis.targetPrice) - latestPrice) / latestPrice) * 100;
  const latestPriceDate = history.length > 0 ? history[history.length - 1].date : null;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-14">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        ← All theses
      </Link>

      <div className="mt-6 flex items-start justify-between gap-6">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-data text-sm text-muted">{thesis.ticker}</span>
            {thesis.sector && <span className="text-sm text-muted">{thesis.sector}</span>}
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{thesis.companyName}</h1>
        </div>
        {thesis.status !== "open" && (
          <span className="mt-1 flex-shrink-0 rounded-full bg-ink/5 px-3 py-1 text-xs text-muted">
            {thesis.status.replace("closed_", "")}
          </span>
        )}
      </div>

      <div className="mt-8">
        <PerformanceChart
          data={indexed}
          tickerLabel={thesis.ticker}
          sectorLabel={thesis.sectorEtf?.ticker ?? null}
        />
        <div className="mt-2">
          <PricesAsOf date={latestPriceDate} />
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-[1fr_260px]">
        <div className="order-2 space-y-10 md:order-1">
          <section>
            <p className="whitespace-pre-wrap leading-relaxed">{thesis.writeUp}</p>
          </section>

          <section>
            <h2 className="text-lg">The bear case</h2>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed text-muted">{thesis.bearCase}</p>
          </section>

          <section>
            <h2 className="text-lg">Journal</h2>
            <div className="mt-3">
              <Journal thesisId={thesis.id} entries={journalEntries} readOnly={!admin} />
            </div>
          </section>
        </div>

        <div className="order-1 space-y-8 md:order-2">
          <div className="border-y border-rule py-1 md:border md:p-4">
            <StatRow label="Entry" value={`$${Number(thesis.entryPrice).toFixed(2)}`} />
            <StatRow label="Current" value={`$${latestPrice.toFixed(2)}`} />
            <StatRow label="Target" value={`$${Number(thesis.targetPrice).toFixed(2)}`} />
            <StatRow
              label="Return"
              value={formatPct(rawReturn)}
              tone={rawReturn >= 0 ? "gain" : "loss"}
            />
            <StatRow
              label="Alpha vs sector"
              value={formatPct(alpha.vsSector)}
              tone={(alpha.vsSector ?? 0) >= 0 ? "gain" : "loss"}
            />
            <StatRow
              label="Alpha vs S&P 500"
              value={formatPct(alpha.vsSp500)}
              tone={(alpha.vsSp500 ?? 0) >= 0 ? "gain" : "loss"}
            />
            <StatRow label="To target" value={formatPct(toTarget)} />
            <StatRow
              label="Held"
              value={(() => {
                const start = new Date(thesis.entryDate);
                const end = thesis.exitDate ? new Date(thesis.exitDate) : new Date();
                const days = Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
                return days < 31 ? `${days}d` : `${Math.round(days / 30.4)}mo`;
              })()}
            />
          </div>

          <div>
            <h2 className="text-base">What would prove this wrong</h2>
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
        </div>
      </div>
    </main>
  );
}
