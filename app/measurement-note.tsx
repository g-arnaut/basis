"use client";

import { useState } from "react";

export function MeasurementNote() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(!open)} className="text-link underline">
        How these are measured
      </button>
      {open && (
        <span className="mt-2 block max-w-md text-muted">
          Each call is indexed to 100 at entry against its sector ETF and the
          S&amp;P 500, so a return above the benchmark line is alpha, not
          market drift. &quot;Beat the index&quot; counts calls currently
          ahead of the S&amp;P 500 over their own holding period, open or
          closed. See{" "}
          <a href="/about" className="text-link underline">
            how this works
          </a>{" "}
          for the full methodology.
        </span>
      )}
    </>
  );
}
