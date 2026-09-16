"use client";

import { useTransition } from "react";
import { refreshFinancials } from "@/app/actions/reports";

export function RefreshFinancialsButton({ reportId }: { reportId: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => refreshFinancials(reportId))}
      disabled={isPending}
      className="text-sm text-link hover:underline disabled:opacity-50"
    >
      {isPending ? "Refreshing…" : "Refresh financials"}
    </button>
  );
}
