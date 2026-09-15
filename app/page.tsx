const pillars = [
  {
    name: "Thesis Tracker",
    detail:
      "Entry, target, bear case, and kill criteria — tracked against sector and S&P 500 benchmarks.",
    status: "In progress",
    active: true,
  },
  {
    name: "Excel Modeling Engine",
    detail:
      "DCF / comps / 3-statement models, uploaded and versioned via named ranges.",
    status: "Phase 2",
    active: false,
  },
  {
    name: "Company Deep-Dives",
    detail: "Auto-pulled financials, ratios, and written analysis per ticker.",
    status: "Phase 2",
    active: false,
  },
  {
    name: "Signal Feed",
    detail: "Stock Scout Agent folded in as a live module.",
    status: "Phase 3",
    active: false,
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-24">
      <p className="font-data text-xs tracking-wide text-[#5B5A54]">
        Week 1 — schema &amp; skeleton
      </p>

      <h1 className="mt-4 text-5xl font-medium leading-[1.1]">Basis</h1>

      <p className="mt-5 max-w-md text-lg leading-relaxed text-[#3A3934]">
        Every thesis measured against its sector and the market — so
        performance shows alpha, not just direction.
      </p>

      <div className="mt-16 border-t border-[#D8D6CD]">
        {pillars.map((pillar, i) => (
          <div
            key={pillar.name}
            className="flex items-baseline justify-between gap-6 border-b border-[#D8D6CD] py-5"
          >
            <div className="flex items-baseline gap-4">
              <span className="font-data text-sm text-[#8B897F]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="text-lg">{pillar.name}</h2>
                <p className="mt-1 max-w-sm text-sm text-[#5B5A54]">
                  {pillar.detail}
                </p>
              </div>
            </div>
            <span
              className={`font-data whitespace-nowrap text-xs ${
                pillar.active ? "text-[#2F6F6B]" : "text-[#8B897F]"
              }`}
            >
              {pillar.status}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
