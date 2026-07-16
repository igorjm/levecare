import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { Dashboard } from "./Dashboard";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: Locale };
  const dict = getDictionary(locale);
  return (
    <main className="container-form py-12 md:py-16">
      <h1 className="text-display-md text-on-background">{dict.dashboard.title}</h1>
      <p className="mt-2 text-body-md text-on-surface-variant">{dict.dashboard.demoNote}</p>
      <Dashboard dict={dict} locale={locale} />
    </main>
  );
}
