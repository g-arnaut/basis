import Link from "next/link";
import { listReports } from "@/app/actions/reports";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await listReports();
  const admin = await isAdmin();

  return (
    <main className="px-6 pb-16 pt-12">
      <p className="label rise text-forest" style={{ ["--i" as string]: 0 }}>
        Research
      </p>
      <div className="rise mt-3 flex items-baseline justify-between gap-4" style={{ ["--i" as string]: 1 }}>
        <h1 className="display text-[5rem] sm:text-[7rem]">Reports</h1>
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
        <div className="mt-10 border-t-2 border-ink">
          {reports.map((r, i) => (
            <Link
              key={r.id}
              href={`/reports/${r.id}`}
              style={{ ["--i" as string]: i + 3 }}
              className="rise group block border-b border-rule py-6 transition-colors hover:bg-surface"
            >
              <div className="flex items-baseline gap-3">
                <span className="display text-[2rem]">
                  {r.ticker}
                </span>
                {r.thesisId && <span className="label text-muted">Linked position</span>}
              </div>
              <h2 className="mt-3 font-serif text-2xl font-semibold leading-snug group-hover:underline">
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
