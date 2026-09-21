"use server";

import { db } from "@/db";
import { theses, benchmarks, journalEntries, priceHistory } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { fetchStooqPrices } from "@/lib/stooq";

const killCriterionSchema = z.object({
  condition: z.string().min(1),
});

const createThesisSchema = z.object({
  ticker: z.string().min(1).max(10).toUpperCase(),
  companyName: z.string().min(1),
  sector: z.string().optional(),
  sectorEtfId: z.coerce.number().int().optional(),
  writeUp: z.string().min(1),
  bearCase: z.string().min(1),
  killCriteria: z.array(killCriterionSchema).min(1),
  entryPrice: z.coerce.number().positive(),
  entryDate: z.string().min(1),
  targetPrice: z.coerce.number().positive(),
});

export async function listOpenTheses() {
  return db.query.theses.findMany({
    where: eq(theses.status, "open"),
    orderBy: [desc(theses.createdAt)],
  });
}

export async function listAllTheses() {
  return db.query.theses.findMany({
    orderBy: [desc(theses.createdAt)],
  });
}

// Lightweight — just ticker/price/return, for the header ticker tape.
// Real data (today's return since entry), not a live feed.
export async function getTapeData() {
  const openTheses = await db.query.theses.findMany({
    where: eq(theses.status, "open"),
  });

  return Promise.all(
    openTheses.map(async (t) => {
      const latest = await db.query.priceHistory.findFirst({
        where: eq(priceHistory.thesisId, t.id),
        orderBy: [desc(priceHistory.date)],
      });
      const price = latest ? Number(latest.stockPrice) : Number(t.entryPrice);
      const returnPct = ((price - Number(t.entryPrice)) / Number(t.entryPrice)) * 100;
      return { ticker: t.ticker, price, returnPct };
    })
  );
}

export async function listSectorEtfBenchmarks() {
  return db.query.benchmarks.findMany({
    where: eq(benchmarks.type, "sector_etf"),
    orderBy: [benchmarks.ticker],
  });
}

export async function getThesis(id: number) {
  return db.query.theses.findFirst({
    where: eq(theses.id, id),
    with: {
      sectorEtf: true,
      sp500Benchmark: true,
    },
  });
}

export async function getPriceHistory(thesisId: number) {
  return db.query.priceHistory.findMany({
    where: eq(priceHistory.thesisId, thesisId),
    orderBy: [priceHistory.date],
  });
}

export async function getJournalEntries(thesisId: number) {
  return db.query.journalEntries.findMany({
    where: eq(journalEntries.thesisId, thesisId),
    orderBy: [desc(journalEntries.createdAt)],
  });
}

// Parses the raw FormData from the new-thesis form, validates it, looks up
// the SPY benchmark automatically (every thesis is measured against it),
// and inserts the row.
export async function createThesis(formData: FormData) {
  await requireAdmin();

  const rawKillCriteria = formData
    .getAll("killCriterion")
    .map((v) => String(v))
    .filter((v) => v.trim().length > 0);

  const parsed = createThesisSchema.parse({
    ticker: formData.get("ticker"),
    companyName: formData.get("companyName"),
    sector: formData.get("sector") || undefined,
    sectorEtfId: formData.get("sectorEtfId") || undefined,
    writeUp: formData.get("writeUp"),
    bearCase: formData.get("bearCase"),
    killCriteria: rawKillCriteria.map((condition) => ({ condition })),
    entryPrice: formData.get("entryPrice"),
    entryDate: formData.get("entryDate"),
    targetPrice: formData.get("targetPrice"),
  });

  const sp500 = await db.query.benchmarks.findFirst({
    where: eq(benchmarks.ticker, "SPY"),
  });

  const sectorEtf = parsed.sectorEtfId
    ? await db.query.benchmarks.findFirst({
        where: eq(benchmarks.id, parsed.sectorEtfId),
      })
    : null;

  const [created] = await db
    .insert(theses)
    .values({
      ticker: parsed.ticker,
      companyName: parsed.companyName,
      sector: parsed.sector,
      sectorEtfId: parsed.sectorEtfId,
      sp500BenchmarkId: sp500?.id,
      writeUp: parsed.writeUp,
      bearCase: parsed.bearCase,
      killCriteria: parsed.killCriteria.map((k) => ({
        condition: k.condition,
        hit: false,
        hitDate: null,
      })),
      entryPrice: parsed.entryPrice.toFixed(4),
      entryDate: parsed.entryDate,
      targetPrice: parsed.targetPrice.toFixed(4),
    })
    .returning({ id: theses.id });

  await db.insert(journalEntries).values({
    thesisId: created.id,
    entryType: "initiation",
    content: `Thesis opened at $${parsed.entryPrice.toFixed(2)}, target $${parsed.targetPrice.toFixed(2)}.`,
  });

  // Seed the entry-date price_history row now, not just via the next
  // day's cron run — indexPriceSeries indexes off the *first* point in
  // history, so without a real benchmark price on day one, "vs sector"
  // and "vs S&P" have no base to index from and stay blank forever, even
  // after later rows come in. The stock leg stays exactly what was
  // entered above; only the benchmark legs are fetched here.
  const benchmarkTickers = [sectorEtf?.ticker, sp500?.ticker].filter(
    (t): t is string => Boolean(t)
  );
  const benchmarkPrices =
    benchmarkTickers.length > 0 ? await fetchStooqPrices(benchmarkTickers) : {};

  await db.insert(priceHistory).values({
    thesisId: created.id,
    date: parsed.entryDate,
    stockPrice: parsed.entryPrice.toFixed(4),
    sectorEtfPrice:
      sectorEtf && benchmarkPrices[sectorEtf.ticker] != null
        ? benchmarkPrices[sectorEtf.ticker]!.toFixed(4)
        : null,
    sp500Price:
      sp500 && benchmarkPrices[sp500.ticker] != null
        ? benchmarkPrices[sp500.ticker]!.toFixed(4)
        : null,
  });

  revalidatePath("/");
  redirect(`/theses/${created.id}`);
}

export async function addJournalEntry(thesisId: number, content: string) {
  await requireAdmin();
  if (!content.trim()) return;
  await db.insert(journalEntries).values({
    thesisId,
    entryType: "update",
    content: content.trim(),
  });
  revalidatePath(`/theses/${thesisId}`);
}

export async function toggleKillCriterion(
  thesisId: number,
  index: number,
  hit: boolean
) {
  await requireAdmin();
  const thesis = await db.query.theses.findFirst({
    where: eq(theses.id, thesisId),
  });
  if (!thesis) return;

  const criteria = [...(thesis.killCriteria as any[])];
  if (!criteria[index]) return;
  criteria[index] = {
    ...criteria[index],
    hit,
    hitDate: hit ? new Date().toISOString().slice(0, 10) : null,
  };

  await db
    .update(theses)
    .set({ killCriteria: criteria, updatedAt: new Date() })
    .where(eq(theses.id, thesisId));

  if (hit) {
    await db.insert(journalEntries).values({
      thesisId,
      entryType: "kill_criteria_check",
      content: `Kill criterion triggered: ${criteria[index].condition}`,
    });
  }

  revalidatePath(`/theses/${thesisId}`);
}

export async function closeThesis(
  thesisId: number,
  exitPrice: number,
  outcome: "closed_win" | "closed_loss" | "closed_flat",
  postMortem: string
) {
  await requireAdmin();
  await db
    .update(theses)
    .set({
      status: outcome,
      exitPrice: exitPrice.toFixed(4),
      exitDate: new Date().toISOString().slice(0, 10),
      updatedAt: new Date(),
    })
    .where(eq(theses.id, thesisId));

  await db.insert(journalEntries).values({
    thesisId,
    entryType: "closeout",
    content: `Closed at $${exitPrice.toFixed(2)} (${outcome.replace("closed_", "")}). ${postMortem.trim()}`,
  });

  revalidatePath(`/theses/${thesisId}`);
  revalidatePath("/");
}
