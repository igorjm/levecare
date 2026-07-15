import Image from "next/image";
import Link from "next/link";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { Icon } from "@/components/ui/DemoBadge";
import { getDictionary, locales, type Locale } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: Locale };
  const dict = getDictionary(locale);
  const planCtas = [dict.plans.ctaSingle, dict.plans.ctaCare, dict.plans.ctaComplete];

  return (
    <main>
      <section className="container-marketing pb-16 pt-10 md:pb-24 md:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <DemoBadge>{dict.hero.badge}</DemoBadge>
            <p className="mt-5 text-label uppercase text-primary">{dict.hero.eyebrow}</p>
            <h1 className="mt-3 text-display-md text-on-background md:text-display-lg">{dict.hero.title}</h1>
            <p className="mt-5 max-w-xl text-body-lg text-on-surface-variant">{dict.hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/avaliacao/`}
                className="inline-flex items-center justify-center rounded-[12px] bg-primary-action px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-hover"
              >
                {dict.hero.cta}
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-[12px] border border-hairline bg-white px-6 py-3 text-sm font-semibold text-on-surface-variant transition hover:border-primary hover:text-primary"
              >
                {dict.hero.secondary}
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-[20px] border border-hairline shadow-soft">
            <Image
              src="/hero-lifestyle.png"
              alt=""
              width={1024}
              height={640}
              priority
              className="h-[280px] w-full object-cover sm:h-[360px] lg:h-[400px]"
            />
          </div>
        </div>
      </section>

      <section id="features" className="bg-surface py-16 md:py-20">
        <div className="container-marketing">
          <h2 className="text-center text-display-md text-on-background md:text-headline md:text-[32px] md:leading-10">
            {dict.features.title}
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {dict.features.items.map((item) => (
              <div
                key={item.title}
                className="rounded-[16px] border border-hairline bg-white p-5 shadow-soft"
              >
                <Icon name={item.icon} className="text-[28px]" />
                <h3 className="mt-4 font-semibold text-primary">{item.title}</h3>
                <p className="mt-2 text-caption text-on-surface-variant">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container-marketing">
          <h2 className="text-center text-display-md text-on-background">{dict.plans.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-body-md text-on-surface-variant">
            {dict.plans.subtitle}
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {dict.plans.items.map((plan, index) => {
              const highlight = "highlight" in plan && plan.highlight;
              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-[16px] border bg-white p-6 shadow-soft ${
                    highlight ? "border-primary-action ring-2 ring-primary-action/20" : "border-hairline"
                  }`}
                >
                  {highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-action px-3 py-0.5 text-xs font-semibold text-white">
                      {dict.plans.recommended}
                    </span>
                  )}
                  <h3 className="font-display text-xl font-semibold text-on-background">{plan.name}</h3>
                  <p className="mt-3">
                    <span className="text-3xl font-bold text-primary">{plan.price}</span>{" "}
                    <span className="text-caption text-outline">{plan.period}</span>
                  </p>
                  <ul className="mt-5 flex-1 space-y-2 text-caption text-on-surface-variant">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="mt-0.5 text-primary-action">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={index === 0 ? `/${locale}/agenda/` : `/${locale}/avaliacao/`}
                    className={`mt-6 inline-flex items-center justify-center rounded-[12px] px-5 py-2.5 text-sm font-semibold transition ${
                      highlight
                        ? "bg-primary-action text-white hover:bg-primary-hover"
                        : "border border-primary-action text-primary-action hover:bg-primary-action/5"
                    }`}
                  >
                    {planCtas[index]}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
