import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const other = locale === "pt" ? "en" : "pt";
  return (
    <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href={`/${locale}/`} className="text-xl font-bold text-teal-700">
          Leve<span className="text-slate-800">Care</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
          <Link href={`/${locale}/avaliacao/`} className="hover:text-teal-700">
            {dict.nav.intake}
          </Link>
          <Link href={`/${locale}/agenda/`} className="hover:text-teal-700">
            {dict.nav.booking}
          </Link>
          <Link href={`/${locale}/painel/`} className="hover:text-teal-700">
            {dict.nav.dashboard}
          </Link>
          <Link
            href={`/${other}/`}
            className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs uppercase hover:border-teal-600 hover:text-teal-700"
          >
            {other}
          </Link>
        </nav>
      </div>
    </header>
  );
}
