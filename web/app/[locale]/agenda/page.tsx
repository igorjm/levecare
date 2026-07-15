import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { BookingFlow } from "./BookingFlow";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function BookingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: Locale };
  const dict = getDictionary(locale);
  return (
    <main className="container-form py-12 md:py-16">
      <p className="text-label uppercase text-outline">{dict.nav.booking}</p>
      <h1 className="mt-2 text-display-md text-on-background">{dict.booking.title}</h1>
      <p className="mt-2 text-body-md text-on-surface-variant">{dict.booking.subtitle}</p>
      <BookingFlow dict={dict} locale={locale} />
    </main>
  );
}
