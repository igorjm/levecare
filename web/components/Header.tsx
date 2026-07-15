"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary, Locale } from "@/lib/i18n";

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const other = locale === "pt" ? "en" : "pt";
  const pathname = usePathname() ?? "";
  const links = [
    { href: `/${locale}/avaliacao/`, label: dict.nav.intake, match: "/avaliacao" },
    { href: `/${locale}/agenda/`, label: dict.nav.booking, match: "/agenda" },
    { href: `/${locale}/painel/`, label: dict.nav.dashboard, match: "/painel" },
  ];

  const otherHref = pathname.replace(`/${locale}`, `/${other}`) || `/${other}/`;

  return (
    <header className="glass-header sticky top-0 z-50 border-b border-hairline">
      <div className="container-marketing flex h-16 items-center justify-between gap-4">
        <Link href={`/${locale}/`} className="font-display text-2xl font-bold tracking-tight text-primary">
          LeveCare
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => {
            const active = pathname.includes(link.match);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-body-md transition-colors ${
                  active
                    ? "border-b-2 border-primary pb-0.5 font-semibold text-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <nav className="flex gap-3 text-sm md:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-on-surface-variant hover:text-primary"
              >
                {link.label.slice(0, 3)}
              </Link>
            ))}
          </nav>
          <Link
            href={otherHref}
            className="rounded-full border border-hairline px-2.5 py-0.5 text-xs font-semibold uppercase text-on-surface-variant transition hover:border-primary hover:text-primary"
          >
            {other}
          </Link>
        </div>
      </div>
    </header>
  );
}
