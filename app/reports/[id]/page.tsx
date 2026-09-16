import Link from "next/link";
import { notFound } from "next/navigation";
import { getReport } from "@/app/actions/reports";
import { isAdmin } from "@/lib/auth";
import { RefreshFinancialsButton } from "./refresh-financials-button";
import { PdfAttachment } from "./pdf-attachment";
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
    <div className="border-b border-rule py-2.5 last:border-b-0">
      <p className="text-xs text-muted">{label}</p>
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
    <main className="mx-auto w-full max-w-4xl px-6 py-14">
      <div className="flex items-center justify-between">
        <Link href="/reports" className="text-sm text-muted hover:text-ink">
          ← Reports
        </Link>
        {admin && <DeleteReportButton reportId={report.id} />}
      </div>

      <div className="mt-6">
        <div className="flex items-baseline gap-2">
          <span className="font-data text-sm text-muted">{report.ticker}</span>
          {report.thesis && (
            <Link href={`/theses/${report.thesis.id}`} className="text-sm text-link hover:underline">
              Position {report.thesis.ticker} {report.thesis.status === "open" ? "open" : "closed"} →
            </Link>
          )}
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{report.title}</h1>
        <p className="mt-1 text-muted">{report.companyName}</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-[1fr_260px]">
        <div className="order-2 md:order-1">
          <p className="whitespace-pre-wrap leading-relaxed">{report.analysis}</p>
        </div>

        <div className="order-1 space-y-4 md:order-2">
          <div className="border-y border-rule py-1 md:border md:p-4">
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
              <p className="py-3 text-sm text-muted">
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
