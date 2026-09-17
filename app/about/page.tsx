import Link from "next/link";

const points: { title: string; body: string }[] = [
  {
    title: "Every thesis is public, win or lose.",
    body: "Nothing gets taken down because it didn't work out. A record that only shows the good calls isn't a record.",
  },
  {
    title: "Every thesis states its kill criteria upfront.",
    body: "Specific, falsifiable conditions, written when the thesis opens and not added after the fact once something's gone wrong. If a condition is met, it's checked off and dated on the page.",
  },
  {
    title: "Performance is measured against two benchmarks, not one.",
    body: "Every position gets a sector ETF and the S&P 500, indexed to 100 at entry, same as the stock. Alpha is the stock's indexed return minus the benchmark's, over exactly the period held and not since some arbitrary start date.",
  },
  {
    title: "Prices update once a day, not live.",
    body: "A scheduled job logs an end-of-day quote for every open position and its benchmarks. Intraday swings aren't reflected until the next day's log.",
  },
  {
    title: "There's no edit button.",
    body: "A thesis's write-up and bear case are fixed at publication. A changed view goes in the dated journal underneath, not a silent rewrite of the original.",
  },
  {
    title: "Closing a position requires saying what happened.",
    body: "Not just an exit price, but a real reflection on whether the thesis played out, and if not, why.",
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        ← Basis
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">How this works</h1>

      <div className="mt-10 space-y-8">
        {points.map((p) => (
          <div key={p.title} className="border-t border-rule pt-6">
            <p className="font-medium">{p.title}</p>
            <p className="mt-1.5 leading-relaxed text-muted">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 border-t border-rule pt-6">
        <p className="font-medium">Personal research. Not investment advice.</p>
        <p className="mt-1.5 leading-relaxed text-muted">
          Assume the author may hold, or intend to hold, anything discussed
          here. Nothing on this site accounts for anyone else's
          circumstances, risk tolerance, or goals.
        </p>
      </div>
    </main>
  );
}
