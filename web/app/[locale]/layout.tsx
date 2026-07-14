import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getDictionary, locales, type Locale } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale as Locale} dict={dict} />
      <div className="flex-1">{children}</div>
      <Footer dict={dict} />
    </div>
  );
}
