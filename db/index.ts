import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// A single, module-level connection is fine on Vercel's Node runtime for
// this project's scale. If you later hit connection-limit issues with
// Supabase, switch this to the pooled connection string (port 6543 /
// pgbouncer) instead of adding a pooling layer here.
const client = postgres(process.env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });
