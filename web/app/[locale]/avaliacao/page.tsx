import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { IntakeForm } from "./IntakeForm";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function IntakePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: Locale };
  const dict = getDictionary(locale);
  return (
    <main className="container-form py-12 md:py-16">
      <h1 className="text-display-md text-on-background">{dict.intake.title}</h1>
      <p className="mt-2 text-body-md text-on-surface-variant">{dict.intake.subtitle}</p>
      <IntakeForm locale={locale} dict={dict} />
    </main>
  );
}
