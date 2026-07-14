import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { IntakeForm } from "./IntakeForm";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function IntakePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: Locale };
  const dict = getDictionary(locale);
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">{dict.intake.title}</h1>
      <p className="mt-2 text-slate-600">{dict.intake.subtitle}</p>
      <IntakeForm locale={locale} dict={dict} />
    </main>
  );
}
