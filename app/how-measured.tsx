"use client";

import { useState } from "react";

export function HowMeasured() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3">
      <button onClick={() => setOpen(!open)} className="text-sm text-link hover:underline">
        {open ? "Hide" : "How these numbers are measured"}
      </button>
      {open && (
        <div className="mt-3 space-y-2 border-l-2 border-rule pl-4 text-sm text-muted">
          <p>
            Every thesis gets a sector ETF benchmark (picked at open) and the
            S&amp;P 500 automatically. Both are indexed to 100 at the
            thesis&apos;s entry date, same as the stock, so alpha is just the
            stock&apos;s indexed return minus the benchmark&apos;s.
          </p>
          <p>
            Prices are logged once a day by a scheduled job pulling end-of-day
            quotes, so intraday moves aren&apos;t reflected until the next
            log. Open positions update daily; closed ones stop at their last
            logged price before close.
          </p>
        </div>
      )}
    </div>
  );
}
