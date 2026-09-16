import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { listAllTheses, getTapeData } from "@/app/actions/theses";
import { listReports } from "@/app/actions/reports";
import { Sidebar } from "./sidebar";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Basis",
  description:
    "Equity research notes and a public record of every call — each one measured against its sector and the market over exactly the period it was held.",
};

function Mark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="flex-shrink-0">
      <rect x="0.5" y="0.5" width="15" height="15" fill="currentColor" />
      <rect x="4" y="4" width="4" height="8" style={{ fill: "var(--color-paper)" }} />
    </svg>
  );
}

function tapeTone(n: number) {
  return n >= 0 ? "text-gain" : "text-loss";
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  const [allTheses, reports, tape] = await Promise.all([
    listAllTheses(),
    listReports(),
    getTapeData(),
  ]);

  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <header className="sticky top-0 z-10 border-b border-rule bg-paper/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="flex items-center gap-2 font-semibold tracking-tight">
                <Mark />
                Basis
              </span>
              <span className="font-data hidden text-[10px] uppercase tracking-[0.14em] text-muted sm:inline">
                Research desks
              </span>
            </Link>

            {tape.length > 0 && (
              <div className="font-data flex flex-1 flex-wrap gap-x-5 gap-y-1 text-xs">
                {tape.map((t) => (
                  <span key={t.ticker} className="flex items-baseline gap-1.5">
                    <span className="text-muted">{t.ticker}</span>
                    <span>${t.price.toFixed(2)}</span>
                    <span className={tapeTone(t.returnPct)}>
                      {t.returnPct >= 0 ? "+" : ""}
                      {t.returnPct.toFixed(1)}%
                    </span>
                  </span>
                ))}
              </div>
            )}

            <div className="ml-auto flex items-center gap-4 text-sm">
              {admin ? (
                <>
                  <Link href="/theses/new" className="text-muted hover:text-ink">
                    New thesis
                  </Link>
                  <form action={logout}>
                    <button type="submit" className="text-muted hover:text-ink">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/admin/login" className="text-muted hover:text-ink">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)]">
          <Sidebar equityCount={allTheses.length} reportCount={reports.length} />
          <div className="min-w-0">{children}</div>
        </div>

        <footer className="mx-auto w-full max-w-6xl px-6 pb-10 pt-4 md:pl-[224px]">
          <p className="border-t border-rule pt-4 text-sm text-muted">
            Personal research. Not investment advice.
          </p>
        </footer>
      </body>
    </html>
  );
}
