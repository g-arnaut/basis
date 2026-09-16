"use client";

import { useRef, useTransition } from "react";
import { addJournalEntry } from "@/app/actions/theses";

type Entry = {
  id: number;
  entryType: string;
  content: string;
  createdAt: Date;
};

export function Journal({
  thesisId,
  entries,
  readOnly,
}: {
  thesisId: number;
  entries: Entry[];
  readOnly: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div>
      {!readOnly && (
        <form
          ref={formRef}
          action={(formData) => {
            const content = String(formData.get("content") || "");
            startTransition(async () => {
              await addJournalEntry(thesisId, content);
              formRef.current?.reset();
            });
          }}
          className="flex gap-2"
        >
          <input
            name="content"
            required
            placeholder="Add a dated note..."
            className="flex-1 border-b border-rule bg-transparent py-1.5 focus:border-ink focus:outline-none"
          />
          <button
            type="submit"
            disabled={isPending}
            className="text-sm text-link hover:underline disabled:opacity-50"
          >
            Add
          </button>
        </form>
      )}

      {entries.length === 0 && readOnly ? (
        <p className="text-sm text-muted">No entries yet.</p>
      ) : (
        <ul className="mt-6 space-y-5">
          {entries.map((e) => (
            <li key={e.id} className="border-l-2 border-rule pl-4">
              <div className="flex items-center gap-2">
                <p className="font-data text-xs text-muted">
                  {new Date(e.createdAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                {e.entryType !== "update" && (
                  <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] text-muted">
                    {e.entryType.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              <p className="mt-1">{e.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
