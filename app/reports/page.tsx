import Link from "next/link";
import { listReports } from "@/app/actions/reports";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await listReports();
  const admin = await isAdmin();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        ← Basis
      </Link>

      <div className="mt-4 flex items-baseline justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        {admin && (
          <Link href="/reports/new" className="text-sm text-link hover:underline">
            New report
          </Link>
        )}
      </div>
      <p className="mt-2 text-muted">Deeper work behind the calls — financials, ratios, and the case.</p>

      {reports.length === 0 ? (
        <div className="mt-16 border-y border-rule py-14 text-center text-muted">
          <p>No reports yet.</p>
          {admin && (
            <Link href="/reports/new" className="mt-2 inline-block text-link underline">
              Write the first one
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-8">
          {reports.map((r) => (
            <Link
              key={r.id}
              href={`/reports/${r.id}`}
              className="block border-b border-rule py-5 hover:bg-ink/[0.02]"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-data text-sm text-muted">{r.ticker}</span>
                {r.thesisId && <span className="text-xs text-muted">· position open</span>}
              </div>
              <h2 className="mt-1 font-medium">{r.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{r.analysis}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
