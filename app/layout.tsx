import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { listAllTheses, getTapeData } from "@/app/actions/theses";
import { listReports } from "@/app/actions/reports";
import { MainNav } from "./main-nav";
import "./globals.css";

// Archivo's width axis gives us a heavy condensed cut for headlines (.display)
// and a normal-width cut for interface text.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Basis",
  description:
    "Equity research notes and a public record of every call, each one measured against its sector and the market over exactly the period it was held.",
};

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
      className={`${archivo.variable} ${plexMono.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col text-ink">
        <header className="sticky top-0 z-20 bg-night text-night-text">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-x-8 gap-y-2 px-6 py-3.5">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Basis, home">
              <span aria-hidden className="block h-4 w-4 bg-lime" />
              <span className="display text-[1.7rem] uppercase leading-none tracking-[0.02em]">
                Basis
              </span>
            </Link>

            <MainNav equityCount={allTheses.length} reportCount={reports.length} />

            <div className="ml-auto flex items-center gap-5 text-sm">
              {admin ? (
                <>
                  <Link href="/theses/new" className="font-medium text-lime hover:underline">
                    New thesis +
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
            <div className="border-t border-white/10 bg-black/30">
              <div className="no-scrollbar font-data mx-auto flex w-full max-w-6xl items-center gap-7 overflow-x-auto whitespace-nowrap px-6 py-1.5 text-xs">
                <span className="label flex-shrink-0 text-lime">Open · since entry</span>
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

        <div className="mx-auto w-full max-w-6xl flex-1">{children}</div>

        <footer className="mx-auto w-full max-w-6xl px-6 pb-10 pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-t-2 border-ink pt-4">
            <p className="label text-muted">Personal research. Not investment advice.</p>
            <p className="label text-muted">Basis · {new Date().getFullYear()}</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
