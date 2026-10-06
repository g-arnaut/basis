import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Newsreader } from "next/font/google";
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

const newsreader = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Basis",
  description:
    "Equity research notes and a public record of every call, each one measured against its sector and the market over exactly the period it was held.",
};

function Mark() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" className="flex-shrink-0 text-brass" aria-hidden>
      <rect x="0.5" y="0.5" width="15" height="15" fill="currentColor" />
      <rect x="4" y="4" width="4" height="8" style={{ fill: "var(--color-night)" }} />
    </svg>
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  const [allTheses, reports, tape] = await Promise.all([
    listAllTheses(),
    listReports(),
    getTapeData(),
  ]);

  const navLink = "text-night-muted transition-colors hover:text-night-text";

  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col text-ink">
        <header className="sticky top-0 z-20 border-b border-brass/60 bg-night text-night-text">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-6 py-3">
            <Link href="/" className="flex items-center gap-3">
              <Mark />
              <span className="font-serif text-[1.35rem] font-semibold leading-none tracking-tight">
                Basis
              </span>
              <span className="label hidden text-night-muted sm:inline">Equity research</span>
            </Link>

            <div className="ml-auto flex items-center gap-5 text-sm">
              {admin ? (
                <>
                  <Link href="/theses/new" className={navLink}>
                    New thesis
                  </Link>
                  <form action={logout}>
                    <button type="submit" className={navLink}>
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/admin/login" className={navLink}>
                  Sign in
                </Link>
              )}
            </div>
          </div>

          {tape.length > 0 && (
            <div className="border-t border-white/10">
              <div className="no-scrollbar font-data mx-auto flex w-full max-w-6xl items-center gap-6 overflow-x-auto whitespace-nowrap px-6 py-1.5 text-xs">
                <span className="label flex-shrink-0 text-brass">Open, since entry</span>
                {tape.map((t) => (
                  <span key={t.ticker} className="flex flex-shrink-0 items-baseline gap-2">
                    <span className="font-medium text-night-text">{t.ticker}</span>
                    <span className="text-night-muted">${t.price.toFixed(2)}</span>
                    <span className={t.returnPct >= 0 ? "text-gain-night" : "text-loss-night"}>
                      <span aria-hidden className="mr-0.5 text-[8px]">
                        {t.returnPct >= 0 ? "▲" : "▼"}
                      </span>
                      {t.returnPct >= 0 ? "+" : ""}
                      {t.returnPct.toFixed(1)}%
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </header>

        <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 md:grid-cols-[208px_minmax(0,1fr)]">
          <Sidebar equityCount={allTheses.length} reportCount={reports.length} />
          <div className="min-w-0">{children}</div>
        </div>

        <footer className="mx-auto w-full max-w-6xl px-6 pb-10 pt-4 md:pl-[232px]">
          <p className="label border-t border-rule pt-4 leading-relaxed text-muted">
            Personal research. Not investment advice.
          </p>
        </footer>
      </body>
    </html>
  );
}
