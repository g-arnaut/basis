"use client";

import { useRef, useState, useTransition } from "react";
import { uploadReportPdf, removeReportPdf } from "@/app/actions/reports";

export function PdfAttachment({
  reportId,
  pdfUrl,
  pdfFileName,
  admin,
}: {
  reportId: number;
  pdfUrl: string | null;
  pdfFileName: string | null;
  admin: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleUpload(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await uploadReportPdf(formData);
        formRef.current?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  if (!pdfUrl && !admin) return null;

  return (
    <div className="border-t border-rule pt-4">
      {pdfUrl ? (
        <div className="flex items-center justify-between">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-link hover:underline"
          >
            {pdfFileName ?? "View PDF"} ↗
          </a>
          {admin && (
            <button
              onClick={() => startTransition(() => removeReportPdf(reportId))}
              disabled={isPending}
              className="text-sm text-muted hover:text-ink disabled:opacity-50"
            >
              {isPending ? "Removing…" : "Remove"}
            </button>
          )}
        </div>
      ) : (
        <form ref={formRef} action={handleUpload} className="space-y-2">
          <input type="hidden" name="reportId" value={reportId} />
          <label className="text-sm text-muted">Attach a PDF</label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              name="pdf"
              accept="application/pdf"
              required
              className="flex-1 text-sm"
            />
            <button
              type="submit"
              disabled={isPending}
              className="shrink-0 rounded-sm bg-ink px-3 py-1.5 text-sm text-paper disabled:opacity-50"
            >
              {isPending ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-loss">{error}</p>}
    </div>
  );
}
