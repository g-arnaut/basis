"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavRow({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count?: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-baseline justify-between gap-3 px-5 py-2 text-sm transition-colors ${
        active ? "font-medium text-ink" : "text-muted hover:text-ink"
      }`}
    >
      <span
        aria-hidden
        className={`absolute left-0 top-1.5 h-[calc(100%-12px)] w-0.5 bg-brass transition-transform duration-200 ${
          active ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"
        }`}
      />
      <span>{label}</span>
      {count !== undefined && <span className="font-data text-xs text-muted">{count}</span>}
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
  const onReports = pathname === "/reports" || pathname?.startsWith("/reports/");
  const onEquity = pathname === "/" || pathname?.startsWith("/theses");

  return (
    <>
      <aside className="hidden border-r border-rule py-8 md:sticky md:top-24 md:block md:h-fit">
        <p className="label px-5 pb-2 text-muted">Research</p>
        <nav>
          <NavRow href="/" label="Equity" count={equityCount} active={!!onEquity} />
          <NavRow href="/reports" label="Reports" count={reportCount} active={!!onReports} />
        </nav>

        <p className="label px-5 pb-2 pt-8 text-muted">Reference</p>
        <nav>
          <NavRow href="/about" label="Methodology" active={pathname === "/about"} />
        </nav>
      </aside>

      <nav className="no-scrollbar flex gap-5 overflow-x-auto border-b border-rule px-6 py-2.5 text-sm md:hidden">
        <Link href="/" className={onEquity ? "font-medium text-ink" : "text-muted"}>
          Equity
        </Link>
        <Link href="/reports" className={onReports ? "font-medium text-ink" : "text-muted"}>
          Reports
        </Link>
        <Link href="/about" className={pathname === "/about" ? "font-medium text-ink" : "text-muted"}>
          Methodology
        </Link>
      </nav>
    </>
  );
}
