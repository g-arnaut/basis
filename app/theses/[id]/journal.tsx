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
            className="field mt-0 flex-1"
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
        <ul className="mt-6 space-y-6 border-l border-rule">
          {entries.map((e) => (
            <li key={e.id} className="relative pl-5">
              <span aria-hidden className="absolute -left-[3.5px] top-1.5 h-[7px] w-[7px] rounded-full bg-brass" />
              <div className="flex items-center gap-2">
                <p className="font-data text-xs text-muted">
                  {new Date(e.createdAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                {e.entryType !== "update" && (
                  <span className="label rounded-sm border border-rule px-1.5 py-0.5 text-[9px] text-muted">
                    {e.entryType.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              <p className="mt-1.5 leading-relaxed">{e.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
