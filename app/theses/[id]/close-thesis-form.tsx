"use client";

import { useState, useTransition } from "react";
import { closeThesis } from "@/app/actions/theses";

export function CloseThesisForm({ thesisId }: { thesisId: number }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-muted hover:text-loss">
        Close this thesis
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        const exitPrice = Number(formData.get("exitPrice"));
        const outcome = String(formData.get("outcome")) as
          | "closed_win"
          | "closed_loss"
          | "closed_flat";
        const postMortem = String(formData.get("postMortem") || "");
        startTransition(() => {
          closeThesis(thesisId, exitPrice, outcome, postMortem);
        });
      }}
      className="space-y-4 border border-rule bg-surface p-4"
    >
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="label text-muted">Exit price</label>
          <input
            name="exitPrice"
            type="number"
            step="0.01"
            required
            className="field font-data block w-28"
          />
        </div>
        <div>
          <label className="label text-muted">Outcome</label>
          <select
            name="outcome"
            required
            defaultValue="closed_win"
            className="field block"
          >
            <option value="closed_win">Win</option>
            <option value="closed_loss">Loss</option>
            <option value="closed_flat">Flat</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm text-muted">
          What happened: right for the stated reason, right by accident, or wrong?
        </label>
        <textarea
          name="postMortem"
          required
          rows={3}
          className="field"
          placeholder="Be honest about which one it was..."
        />
      </div>
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
        >
          {isPending ? "Closing…" : "Confirm close"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted">
          Cancel
        </button>
      </div>
    </form>
  );
}
