import Link from "next/link";
import { listSectorEtfBenchmarks } from "@/app/actions/theses";
import { isAdmin } from "@/lib/auth";
import { NewThesisForm } from "./new-thesis-form";

export const dynamic = "force-dynamic";

export default async function NewThesisPage() {
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

  const sectorEtfs = await listSectorEtfBenchmarks();
  return <NewThesisForm sectorEtfs={sectorEtfs} />;
}
