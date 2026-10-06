"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavItem({
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
      className={`flex items-baseline gap-1.5 border-b-2 py-1 text-sm transition-colors ${
        active
          ? "border-lime text-night-text"
          : "border-transparent text-night-muted hover:text-night-text"
      }`}
    >
      {label}
      {count !== undefined && <span className="font-data text-[10px] opacity-70">{count}</span>}
    </Link>
  );
}

export function MainNav({
  equityCount,
  reportCount,
}: {
  equityCount: number;
  reportCount: number;
}) {
  const pathname = usePathname();
  const onEquity = pathname === "/" || pathname?.startsWith("/theses");
  const onReports = pathname?.startsWith("/reports");

  return (
    <nav className="flex items-center gap-6">
      <NavItem href="/" label="Equity" count={equityCount} active={!!onEquity} />
      <NavItem href="/reports" label="Reports" count={reportCount} active={!!onReports} />
      <NavItem href="/about" label="Method" active={pathname === "/about"} />
    </nav>
  );
}
