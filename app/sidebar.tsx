"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavRow({
  href,
  label,
  count,
  active,
  disabled,
}: {
  href: string;
  label: string;
  count: number | string;
  active: boolean;
  disabled?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-baseline justify-between gap-3 border-l-2 px-5 py-2 text-sm ${
        active
          ? "border-ink font-medium text-ink"
          : disabled
            ? "border-transparent text-muted/60"
            : "border-transparent text-muted hover:border-rule hover:text-ink"
      }`}
    >
      <span>{label}</span>
      <span className="font-data text-xs text-muted">{count}</span>
    </Link>
  );
}

export function Sidebar({
  equityCount,
  reportCount,
}: {
  equityCount: number;
  reportCount: number;
}) {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden border-r border-rule py-6 md:block">
        <p className="px-5 pb-2 text-xs uppercase tracking-wider text-muted">Desks</p>
        <nav>
          <NavRow href="/" label="Equity" count={equityCount} active={pathname === "/"} />
          <NavRow
            href="/credit"
            label="Credit"
            count={0}
            active={pathname === "/credit"}
            disabled
          />
          <NavRow
            href="/derivatives"
            label="Derivatives"
            count={0}
            active={pathname === "/derivatives"}
            disabled
          />
        </nav>

        <p className="px-5 pb-2 pt-6 text-xs uppercase tracking-wider text-muted">Reports</p>
        <nav>
          <NavRow
            href="/reports"
            label="All reports"
            count={reportCount}
            active={pathname === "/reports" || pathname?.startsWith("/reports/")}
          />
        </nav>

        <p className="px-5 pb-2 pt-6 text-xs uppercase tracking-wider text-muted">Reference</p>
        <nav>
          <Link
            href="/about"
            className={`block border-l-2 px-5 py-2 text-sm ${
              pathname === "/about"
                ? "border-ink font-medium text-ink"
                : "border-transparent text-muted hover:border-rule hover:text-ink"
            }`}
          >
            Methodology
          </Link>
        </nav>
      </aside>

      <nav className="flex gap-4 overflow-x-auto border-b border-rule px-6 py-2 text-sm md:hidden">
        <Link href="/" className={pathname === "/" ? "font-medium text-ink" : "text-muted"}>
          Equity
        </Link>
        <Link href="/credit" className={pathname === "/credit" ? "font-medium text-ink" : "text-muted/60"}>
          Credit
        </Link>
        <Link
          href="/derivatives"
          className={pathname === "/derivatives" ? "font-medium text-ink" : "text-muted/60"}
        >
          Derivatives
        </Link>
        <Link href="/reports" className={pathname?.startsWith("/reports") ? "font-medium text-ink" : "text-muted"}>
          Reports
        </Link>
        <Link href="/about" className={pathname === "/about" ? "font-medium text-ink" : "text-muted"}>
          Methodology
        </Link>
      </nav>
    </>
  );
}
