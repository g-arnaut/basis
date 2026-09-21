import { tradingDaysSince } from "@/lib/performance";

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Matches how positionrecord.com surfaces data freshness: a plain "as of"
// line, with a visible warning once the last logged price is more than 3
// trading days stale (the cron only runs weekdays, so a Monday morning
// visit with Friday's close is normal and shouldn't look broken).
export function PricesAsOf({ date }: { date: string | null }) {
  if (!date) return null;

  const staleDays = tradingDaysSince(date);
  const stale = staleDays > 3;

  return (
    <p className={`font-data text-xs ${stale ? "text-loss" : "text-muted"}`}>
      Prices as of {formatDate(date)}
      {stale && ` (stale: ${staleDays} trading days old)`}
    </p>
  );
}
