import Link from "next/link";
import { listAllTheses } from "@/app/actions/theses";
import { isAdmin } from "@/lib/auth";
import { NewReportForm } from "./new-report-form";

export const dynamic = "force-dynamic";

export default async function NewReportPage() {
  const admin = await isAdmin();

  if (!admin) {
    return (
      <main className="mx-auto flex min-h-[50vh] w-full max-w-2xl flex-col items-center justify-center px-6 text-center">
        <p className="text-muted">This page is only open to the site owner.</p>
        <Link href="/admin/login" className="mt-2 text-sm underline">
          Sign in
        </Link>
      </main>
    );
  }

  const theses = await listAllTheses();
  return <NewReportForm theses={theses.map((t) => ({ id: t.id, ticker: t.ticker, companyName: t.companyName }))} />;
}
