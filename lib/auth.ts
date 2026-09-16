import { cookies } from "next/headers";
import { createHash } from "crypto";

// Single-owner site — one shared password (ADMIN_PASSWORD), not a full
// accounts system. The cookie holds a hash of the password, not the
// password itself, so it's not sitting in plaintext in the browser.

const COOKIE_NAME = "basis_admin";

function expectedToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHash("sha256").update(password).digest("hex");
}

export async function isAdmin(): Promise<boolean> {
  const token = expectedToken();
  if (!token) return false; // no password configured = no admin access, ever
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === token;
}

// Call at the top of every mutating server action.
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("Not authorized");
  }
}

export async function setAdminCookie(): Promise<void> {
  const token = expectedToken();
  if (!token) throw new Error("ADMIN_PASSWORD is not set");
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
