"use server";

import { db } from "@/db";
import { companyReports } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { fetchCompanyFinancials } from "@/lib/fmp";
import { put, del } from "@vercel/blob";

const createReportSchema = z.object({
  ticker: z.string().min(1).max(10).toUpperCase(),
  companyName: z.string().min(1),
  title: z.string().min(1),
  analysis: z.string().min(1),
  thesisId: z.coerce.number().int().optional(),
});

export async function listReports() {
  return db.query.companyReports.findMany({
    orderBy: [desc(companyReports.createdAt)],
  });
}

export async function getReport(id: number) {
  return db.query.companyReports.findFirst({
    where: eq(companyReports.id, id),
    with: { thesis: true },
  });
}

function toNumericString(n: number | null): string | null {
  return n != null ? String(n) : null;
}

export async function createReport(formData: FormData) {
  await requireAdmin();

  const parsed = createReportSchema.parse({
    ticker: formData.get("ticker"),
    companyName: formData.get("companyName"),
    title: formData.get("title"),
    analysis: formData.get("analysis"),
    thesisId: formData.get("thesisId") || undefined,
  });

  let financials: Awaited<ReturnType<typeof fetchCompanyFinancials>> | null = null;
  let fetchError: string | null = null;
  try {
    financials = await fetchCompanyFinancials(parsed.ticker);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Unknown error fetching financials";
  }

  const [created] = await db
    .insert(companyReports)
    .values({
      ticker: parsed.ticker,
      companyName: parsed.companyName,
      title: parsed.title,
      analysis: parsed.analysis,
      thesisId: parsed.thesisId,
      fiscalPeriod: financials?.fiscalPeriod ?? null,
      revenue: toNumericString(financials?.revenue ?? null),
      netIncome: toNumericString(financials?.netIncome ?? null),
      grossMargin: toNumericString(financials?.grossMargin ?? null),
      operatingMargin: toNumericString(financials?.operatingMargin ?? null),
      netMargin: toNumericString(financials?.netMargin ?? null),
      freeCashFlow: toNumericString(financials?.freeCashFlow ?? null),
      totalDebt: toNumericString(financials?.totalDebt ?? null),
      cash: toNumericString(financials?.cash ?? null),
      evToEbitda: toNumericString(financials?.evToEbitda ?? null),
      roe: toNumericString(financials?.roe ?? null),
      roic: toNumericString(financials?.roic ?? null),
      rawFinancials: financials?.raw ?? null,
      financialsFetchedAt: financials ? new Date() : null,
      financialsError: fetchError,
    })
    .returning({ id: companyReports.id });

  revalidatePath("/reports");
  revalidatePath("/");
  redirect(`/reports/${created.id}`);
}

export async function refreshFinancials(reportId: number) {
  await requireAdmin();

  const report = await db.query.companyReports.findFirst({
    where: eq(companyReports.id, reportId),
  });
  if (!report) return;

  let financials: Awaited<ReturnType<typeof fetchCompanyFinancials>> | null = null;
  let fetchError: string | null = null;
  try {
    financials = await fetchCompanyFinancials(report.ticker);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Unknown error fetching financials";
  }

  await db
    .update(companyReports)
    .set({
      fiscalPeriod: financials?.fiscalPeriod ?? report.fiscalPeriod,
      revenue: toNumericString(financials?.revenue ?? null) ?? report.revenue,
      netIncome: toNumericString(financials?.netIncome ?? null) ?? report.netIncome,
      grossMargin: toNumericString(financials?.grossMargin ?? null) ?? report.grossMargin,
      operatingMargin: toNumericString(financials?.operatingMargin ?? null) ?? report.operatingMargin,
      netMargin: toNumericString(financials?.netMargin ?? null) ?? report.netMargin,
      freeCashFlow: toNumericString(financials?.freeCashFlow ?? null) ?? report.freeCashFlow,
      totalDebt: toNumericString(financials?.totalDebt ?? null) ?? report.totalDebt,
      cash: toNumericString(financials?.cash ?? null) ?? report.cash,
      evToEbitda: toNumericString(financials?.evToEbitda ?? null) ?? report.evToEbitda,
      roe: toNumericString(financials?.roe ?? null) ?? report.roe,
      roic: toNumericString(financials?.roic ?? null) ?? report.roic,
      rawFinancials: financials?.raw ?? report.rawFinancials,
      financialsFetchedAt: financials ? new Date() : report.financialsFetchedAt,
      financialsError: fetchError,
      updatedAt: new Date(),
    })
    .where(eq(companyReports.id, reportId));

  revalidatePath(`/reports/${reportId}`);
}

const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20MB

export async function uploadReportPdf(formData: FormData) {
  await requireAdmin();

  const reportId = Number(formData.get("reportId"));
  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file selected");
  }
  if (file.type !== "application/pdf") {
    throw new Error("File must be a PDF");
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error("PDF must be under 20MB");
  }

  const report = await db.query.companyReports.findFirst({
    where: eq(companyReports.id, reportId),
  });
  if (!report) throw new Error("Report not found");

  // replace the old file in blob storage if one was already attached
  if (report.pdfUrl) {
    await del(report.pdfUrl).catch(() => {});
  }

  const blob = await put(`reports/${reportId}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  await db
    .update(companyReports)
    .set({
      pdfUrl: blob.url,
      pdfFileName: file.name,
      pdfUploadedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(companyReports.id, reportId));

  revalidatePath(`/reports/${reportId}`);
}

export async function deleteReport(reportId: number) {
  await requireAdmin();

  const report = await db.query.companyReports.findFirst({
    where: eq(companyReports.id, reportId),
  });
  if (!report) return;

  if (report.pdfUrl) {
    await del(report.pdfUrl).catch(() => {});
  }

  await db.delete(companyReports).where(eq(companyReports.id, reportId));

  revalidatePath("/reports");
  revalidatePath("/");
  redirect("/reports");
}

export async function removeReportPdf(reportId: number) {
  await requireAdmin();

  const report = await db.query.companyReports.findFirst({
    where: eq(companyReports.id, reportId),
  });
  if (!report?.pdfUrl) return;

  await del(report.pdfUrl).catch(() => {});

  await db
    .update(companyReports)
    .set({ pdfUrl: null, pdfFileName: null, pdfUploadedAt: null, updatedAt: new Date() })
    .where(eq(companyReports.id, reportId));

  revalidatePath(`/reports/${reportId}`);
}
