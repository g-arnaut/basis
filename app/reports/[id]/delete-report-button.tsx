"use client";

import { useState, useTransition } from "react";
import { deleteReport } from "@/app/actions/reports";

export function DeleteReportButton({ reportId }: { reportId: number }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm text-muted hover:text-loss"
      >
        Delete report
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted">Delete this report permanently?</span>
      <button
        onClick={() => startTransition(() => deleteReport(reportId))}
        disabled={isPending}
        className="text-loss hover:underline disabled:opacity-50"
      >
        {isPending ? "Deleting…" : "Yes, delete"}
      </button>
      <button onClick={() => setConfirming(false)} className="text-muted hover:text-ink">
        Cancel
      </button>
    </div>
  );
}
