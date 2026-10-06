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
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <p className="label rise text-brass" style={{ ["--i" as string]: 0 }}>
        Reference
      </p>
      <h1
        className="rise mt-3 font-serif text-4xl font-medium tracking-tight sm:text-5xl"
        style={{ ["--i" as string]: 1 }}
      >
        How this works
      </h1>

      <ol className="mt-12 border-t border-ink/80">
        {points.map((p, i) => (
          <li
            key={p.title}
            className="rise grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 border-b border-rule py-7"
            style={{ ["--i" as string]: i + 2 }}
          >
            <span className="font-data pt-1 text-xs text-brass">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h2 className="font-serif text-[1.35rem] font-medium leading-snug tracking-tight">
                {p.title}
              </h2>
              <p className="mt-2 max-w-xl leading-relaxed text-muted">{p.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 border border-rule bg-surface p-6">
        <p className="label text-muted">Disclosure</p>
        <p className="mt-2 font-serif text-lg font-medium">Personal research. Not investment advice.</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Assume the author may hold, or intend to hold, anything discussed here. Nothing on this
          site accounts for anyone else&apos;s circumstances, risk tolerance, or goals.
        </p>
      </div>
    </main>
  );
}
