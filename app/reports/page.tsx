import Link from "next/link";
import { listReports } from "@/app/actions/reports";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await listReports();
  const admin = await isAdmin();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <p className="label rise text-brass" style={{ ["--i" as string]: 0 }}>
        Research
      </p>
      <div className="rise mt-3 flex items-baseline justify-between gap-4" style={{ ["--i" as string]: 1 }}>
        <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">Reports</h1>
        {admin && (
          <Link href="/reports/new" className="label text-link hover:underline">
            New report +
          </Link>
        )}
      </div>
      <p className="rise mt-4 max-w-lg text-muted" style={{ ["--i" as string]: 2 }}>
        Deeper work behind the calls: financials, ratios, and the case.
      </p>

      {reports.length === 0 ? (
        <div className="mt-14 border-y border-rule py-16 text-center">
          <p className="font-serif text-xl italic text-muted">No reports yet.</p>
          {admin && (
            <Link href="/reports/new" className="mt-3 inline-block text-link underline">
              Write the first one
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-10 border-t border-ink/80">
          {reports.map((r, i) => (
            <Link
              key={r.id}
              href={`/reports/${r.id}`}
              style={{ ["--i" as string]: i + 3 }}
              className="rise group block border-b border-rule py-6 transition-colors hover:bg-surface"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-data rounded-sm border border-ink/25 px-1.5 py-0.5 text-[11px] font-medium tracking-wide">
                  {r.ticker}
                </span>
                {r.thesisId && <span className="label text-muted">Linked position</span>}
              </div>
              <h2 className="mt-3 font-serif text-2xl font-medium leading-snug tracking-tight group-hover:underline">
                {r.title}
              </h2>
              <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted">
                {r.analysis}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
