import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { BookingFlow } from "./BookingFlow";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function BookingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: Locale };
  const dict = getDictionary(locale);
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">{dict.booking.title}</h1>
      <p className="mt-2 text-slate-600">{dict.booking.subtitle}</p>
      <BookingFlow dict={dict} />
    </main>
  );
}
