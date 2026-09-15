import { db } from "@/db";
import { benchmarks } from "@/db/schema";
import { NextResponse } from "next/server";

// Hit /api/health after deploying + running db:push (+ db:seed) to confirm
// the app can actually reach Postgres from Vercel, not just build.
export async function GET() {
  try {
    const rows = await db.select().from(benchmarks);
    return NextResponse.json({
      ok: true,
      benchmarksSeeded: rows.length,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
