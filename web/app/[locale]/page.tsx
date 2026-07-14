import Link from "next/link";
import { getDictionary, locales, type Locale } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: Locale };
  const dict = getDictionary(locale);

  return (
    <main>
      <section className="bg-gradient-to-b from-teal-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center">
          <span className="inline-block rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            {dict.hero.badge}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {dict.hero.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">{dict.hero.subtitle}</p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href={`/${locale}/avaliacao/`}
              className="rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white shadow hover:bg-teal-700"
            >
              {dict.hero.cta}
            </Link>
            <a
              href="#features"
              className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:border-teal-600 hover:text-teal-700"
            >
              {dict.hero.secondary}
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold text-slate-900">{dict.features.title}</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {dict.features.items.map((item) => (
            <div key={item.title} className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-teal-700">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold text-slate-900">{dict.plans.title}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {dict.plans.items.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border bg-white p-6 shadow-sm ${
                  "highlight" in plan && plan.highlight
                    ? "border-teal-500 ring-2 ring-teal-200"
                    : "border-slate-100"
                }`}
              >
                <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                <p className="mt-2">
                  <span className="text-3xl font-bold text-teal-700">{plan.price}</span>{" "}
                  <span className="text-sm text-slate-500">{plan.period}</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-0.5 text-teal-600">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
