import Link from "next/link";
import { notFound } from "next/navigation";
import { getReport } from "@/app/actions/reports";
import { isAdmin } from "@/lib/auth";
import { RefreshFinancialsButton } from "./refresh-financials-button";
import { PdfAttachment } from "./pdf-attachment";
import { Prose } from "@/app/prose";
import { DeleteReportButton } from "./delete-report-button";

export const dynamic = "force-dynamic";

function formatMoney(n: string | null): string {
  if (n == null) return "—";
  const v = Number(n);
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  return `${sign}$${abs.toLocaleString()}`;
}

function formatPct(n: string | null): string {
  if (n == null) return "—";
  return `${(Number(n) * 100).toFixed(1)}%`;
}

function formatMultiple(n: string | null): string {
  if (n == null) return "—";
  return `${Number(n).toFixed(1)}x`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-white/15 py-2.5 last:border-b-0">
      <p className="text-sm text-night-muted">{label}</p>
      <p className="font-data text-sm">{value}</p>
    </div>
  );
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(Number(id));
  if (!report) notFound();

  const admin = await isAdmin();
  const hasFinancials = report.financialsFetchedAt != null;

  return (
    <main className="px-6 pb-16 pt-8">
      <div className="flex items-center justify-between">
        <Link href="/reports" className="label text-muted transition-colors hover:text-ink">
          ← Reports
        </Link>
        {admin && <DeleteReportButton reportId={report.id} />}
      </div>

      <header className="rise mt-6" style={{ ["--i" as string]: 0 }}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="display text-[3rem]">
            {report.ticker}
          </span>
          <span className="label text-muted">{report.companyName}</span>
          {report.thesis && (
            <Link href={`/theses/${report.thesis.id}`} className="label text-link hover:underline">
              Position {report.thesis.ticker} {report.thesis.status === "open" ? "open" : "closed"} →
            </Link>
          )}
        </div>
        <h1 className="mt-5 max-w-4xl font-serif text-4xl font-bold leading-[1.1] sm:text-[3.4rem]">
          {report.title}
        </h1>
      </header>

      <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rise order-2 md:order-1" style={{ ["--i" as string]: 1 }}>
          <Prose text={report.analysis} />
        </div>

        <div className="rise order-1 space-y-4 md:order-2 md:sticky md:top-32 md:self-start" style={{ ["--i" as string]: 2 }}>
          <div className="bg-night p-5 text-night-text">
            <p className="label border-b border-lime/60 pb-2 text-lime">Financial snapshot</p>
            {hasFinancials ? (
              <>
                <Stat label="Fiscal period" value={report.fiscalPeriod ?? "—"} />
                <Stat label="Revenue" value={formatMoney(report.revenue)} />
                <Stat label="Net income" value={formatMoney(report.netIncome)} />
                <Stat label="Gross margin" value={formatPct(report.grossMargin)} />
                <Stat label="Operating margin" value={formatPct(report.operatingMargin)} />
                <Stat label="Net margin" value={formatPct(report.netMargin)} />
                <Stat label="Free cash flow" value={formatMoney(report.freeCashFlow)} />
                <Stat label="Total debt" value={formatMoney(report.totalDebt)} />
                <Stat label="Cash" value={formatMoney(report.cash)} />
                <Stat label="EV / EBITDA" value={formatMultiple(report.evToEbitda)} />
                <Stat label="ROE" value={formatPct(report.roe)} />
                <Stat label="ROIC" value={formatPct(report.roic)} />
              </>
            ) : (
              <p className="py-4 text-sm text-night-muted">
                {report.financialsError
                  ? `Financials unavailable (${report.financialsError}).`
                  : "Financials unavailable."}
              </p>
            )}
          </div>

          {admin && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">
                {hasFinancials
                  ? `As of ${new Date(report.financialsFetchedAt!).toLocaleDateString()}`
                  : "Not yet pulled"}
              </p>
              <RefreshFinancialsButton reportId={report.id} />
            </div>
          )}

          <PdfAttachment
            reportId={report.id}
            pdfUrl={report.pdfUrl}
            pdfFileName={report.pdfFileName}
            admin={admin}
          />
        </div>
      </div>
    </main>
  );
}
