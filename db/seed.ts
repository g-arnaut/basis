import "dotenv/config";
import { db } from "./index";
import { benchmarks } from "./schema";

// Seed the benchmark tickers you'll actually use. Add sector ETFs here as
// your open theses need them — SPY covers the S&P 500 leg for every thesis.
const seedBenchmarks = [
  { ticker: "SPY", name: "S&P 500 (SPDR)", type: "broad_market" as const },
  { ticker: "XLK", name: "Technology Select Sector SPDR", type: "sector_etf" as const },
  { ticker: "XLF", name: "Financial Select Sector SPDR", type: "sector_etf" as const },
  { ticker: "XLE", name: "Energy Select Sector SPDR", type: "sector_etf" as const },
  { ticker: "XLY", name: "Consumer Discretionary Select Sector SPDR", type: "sector_etf" as const },
  { ticker: "XLP", name: "Consumer Staples Select Sector SPDR", type: "sector_etf" as const },
  { ticker: "XLV", name: "Health Care Select Sector SPDR", type: "sector_etf" as const },
  { ticker: "XLI", name: "Industrial Select Sector SPDR", type: "sector_etf" as const },
];

async function main() {
  console.log("Seeding benchmarks...");
  await db.insert(benchmarks).values(seedBenchmarks).onConflictDoNothing();
  console.log(`Done. Seeded up to ${seedBenchmarks.length} benchmark rows.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
