"use client";

import { useTransition } from "react";
import { toggleKillCriterion } from "@/app/actions/theses";

type Criterion = { condition: string; hit: boolean; hitDate: string | null };

export function KillCriteriaList({
  thesisId,
  criteria,
  readOnly,
}: {
  thesisId: number;
  criteria: Criterion[];
  readOnly: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <ul className="mt-3 space-y-2">
      {criteria.map((c, i) => (
        <li key={i} className="flex items-start gap-3">
          {readOnly ? (
            <span
              className={`mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center border text-[10px] ${
                c.hit ? "border-loss bg-loss text-white" : "border-rule"
              }`}
            >
              {c.hit ? "✓" : ""}
            </span>
          ) : (
            <input
              type="checkbox"
              checked={c.hit}
              disabled={isPending}
              onChange={(e) =>
                startTransition(() => {
                  toggleKillCriterion(thesisId, i, e.target.checked);
                })
              }
              className="mt-1 h-4 w-4 accent-loss"
            />
          )}
          <span className={c.hit ? "text-loss line-through" : ""}>
            {c.condition}
            {c.hit && c.hitDate && (
              <span className="font-data ml-2 text-xs text-muted">
                triggered {c.hitDate}
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
