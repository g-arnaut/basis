"use client";

import { useState } from "react";
import Link from "next/link";
import { createThesis } from "@/app/actions/theses";

type SectorEtf = { id: number; ticker: string; name: string };

const inputClass =
  "mt-1 w-full border-b border-rule bg-transparent py-1.5 focus:border-ink focus:outline-none";
const labelClass = "text-sm text-muted";

function FormSection({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-rule pt-8">
      <div className="flex items-baseline gap-3">
        <span className="font-data text-sm text-muted">{step}</span>
        <h2 className="text-lg">{title}</h2>
      </div>
      <div className="mt-5 space-y-6">{children}</div>
    </section>
  );
}

export function NewThesisForm({ sectorEtfs }: { sectorEtfs: SectorEtf[] }) {
  const [killCriteria, setKillCriteria] = useState<string[]>([""]);
  const [pending, setPending] = useState(false);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        ← All theses
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">New thesis</h1>

      <form
        action={async (formData) => {
          setPending(true);
          await createThesis(formData);
        }}
        className="mt-10"
      >
        <FormSection step="01" title="The position">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Ticker</label>
              <input
                name="ticker"
                required
                maxLength={10}
                className={`font-data ${inputClass}`}
                placeholder="AAPL"
              />
            </div>
            <div>
              <label className={labelClass}>Company name</label>
              <input name="companyName" required className={inputClass} placeholder="Apple Inc." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Sector</label>
              <input name="sector" className={inputClass} placeholder="Technology" />
            </div>
            <div>
              <label className={labelClass}>Sector ETF benchmark</label>
              <select name="sectorEtfId" className={inputClass} required defaultValue="">
                <option value="" disabled>
                  Select one
                </option>
                {sectorEtfs.map((etf) => (
                  <option key={etf.id} value={etf.id}>
                    {etf.ticker} — {etf.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className={labelClass}>Entry price</label>
              <input
                name="entryPrice"
                type="number"
                step="0.01"
                required
                className={`font-data ${inputClass}`}
                placeholder="150.00"
              />
            </div>
            <div>
              <label className={labelClass}>Entry date</label>
              <input name="entryDate" type="date" required className={`font-data ${inputClass}`} />
            </div>
            <div>
              <label className={labelClass}>Target price</label>
              <input
                name="targetPrice"
                type="number"
                step="0.01"
                required
                className={`font-data ${inputClass}`}
                placeholder="200.00"
              />
            </div>
          </div>
        </FormSection>

        <FormSection step="02" title="The case">
          <div>
            <label className={labelClass}>The thesis</label>
            <textarea
              name="writeUp"
              required
              rows={6}
              className={inputClass}
              placeholder="Why this, why now, what has to be true..."
            />
          </div>
          <div>
            <label className={labelClass}>The bear case</label>
            <textarea
              name="bearCase"
              required
              rows={4}
              className={inputClass}
              placeholder="The strongest case against this thesis..."
            />
          </div>
        </FormSection>

        <FormSection step="03" title="What would prove this wrong">
          <p className="text-sm text-muted">
            Falsifiable conditions: if these happen, the thesis is wrong.
          </p>
          <div className="space-y-2">
            {killCriteria.map((_, i) => (
              <div key={i} className="flex gap-2">
                <input
                  name="killCriterion"
                  required
                  className={inputClass}
                  placeholder="e.g. Gross margin falls below 40%"
                  onChange={(e) => {
                    const next = [...killCriteria];
                    next[i] = e.target.value;
                    setKillCriteria(next);
                  }}
                />
                {killCriteria.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setKillCriteria(killCriteria.filter((_, j) => j !== i))}
                    className="text-sm text-muted hover:text-loss"
                  >
                    remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setKillCriteria([...killCriteria, ""])}
            className="text-sm text-link hover:underline"
          >
            + add another
          </button>
        </FormSection>

        <button
          type="submit"
          disabled={pending}
          className="mt-10 w-full rounded-sm bg-ink py-3 text-paper disabled:opacity-50"
        >
          {pending ? "Saving…" : "Open thesis"}
        </button>
      </form>
    </main>
  );
}
