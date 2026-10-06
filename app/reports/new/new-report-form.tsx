"use client";

import { useState } from "react";
import Link from "next/link";
import { createReport } from "@/app/actions/reports";

type ThesisOption = { id: number; ticker: string; companyName: string };

const inputClass = "field";
const labelClass = "label text-muted";

export function NewReportForm({ theses }: { theses: ThesisOption[] }) {
  const [pending, setPending] = useState(false);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14">
      <Link href="/reports" className="label text-muted hover:text-ink">
        ← Reports
      </Link>
      <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight">New report</h1>
      <p className="mt-2 text-sm text-muted">
        Financials pull automatically from the ticker on save. If the pull
        fails, the report still saves with your analysis, and you can retry
        the pull from the report page.
      </p>

      <form
        action={async (formData) => {
          setPending(true);
          await createReport(formData);
        }}
        className="mt-10 space-y-6"
      >
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Ticker</label>
            <input
              name="ticker"
              required
              maxLength={10}
              className={`font-data ${inputClass}`}
              placeholder="PINS"
            />
          </div>
          <div>
            <label className={labelClass}>Company name</label>
            <input name="companyName" required className={inputClass} placeholder="Pinterest Inc." />
          </div>
        </div>

        <div>
          <label className={labelClass}>Link to an existing thesis (optional)</label>
          <select name="thesisId" className={inputClass} defaultValue="">
            <option value="">None — this is a standalone report</option>
            {theses.map((t) => (
              <option key={t.id} value={t.id}>
                {t.ticker} — {t.companyName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Title</label>
          <input
            name="title"
            required
            className={inputClass}
            placeholder="e.g. Two accounting distortions, one direction"
          />
        </div>

        <div>
          <label className={labelClass}>Analysis</label>
          <textarea
            name="analysis"
            required
            rows={10}
            className={inputClass}
            placeholder="The full write-up..."
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-full py-3 disabled:opacity-50"
        >
          {pending ? "Saving and pulling financials…" : "Publish report"}
        </button>
      </form>
    </main>
  );
}
