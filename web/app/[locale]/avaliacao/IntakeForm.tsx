"use client";

import { useState } from "react";
import Link from "next/link";
import { api, type IntakeResult } from "@/lib/api";
import { saveJourney } from "@/lib/journey";
import { bmiClassification, type Dictionary, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { Icon } from "@/components/ui/DemoBadge";

export function IntakeForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.intake;
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(false);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    try {
      const res = await api.submitIntake({
        email,
        age: Number(form.get("age")),
        heightCm: Number(form.get("height")),
        weightKg: Number(form.get("weight")),
        comorbidities: form.getAll("comorbidities").map(String),
        pregnant: form.get("pregnant") === "on",
        eatingDisorderHistory: form.get("eatingDisorder") === "on",
      });
      saveJourney({ intakeId: res.id, email, bmi: res.bmi, eligible: res.eligible });
      setResult(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const classification = bmiClassification(result.bmi, locale);
    const position = Math.min(100, Math.max(0, ((result.bmi - 15) / 30) * 100));

    return (
      <div className="mt-8 space-y-6">
        <div className="text-center">
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 ${
              result.eligible ? "border-primary text-primary" : "border-outline text-outline"
            }`}
          >
            <Icon name={result.eligible ? "check" : "info"} className="text-[28px]" />
          </div>
          <h2 className="mt-4 text-headline text-primary md:text-display-md">
            {result.eligible ? t.eligible : t.notEligible}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-body-md text-on-surface-variant">
            {result.eligible ? t.eligibleText : t.notEligibleText}
          </p>
        </div>

        <SurfaceCard>
          <p className="text-label uppercase text-on-surface-variant">{t.bmiLabel}</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-4xl font-bold text-on-background">
                {result.bmi.toFixed(1)}{" "}
                <span className="text-lg font-semibold text-on-surface-variant">kg/m²</span>
              </p>
              <span className="mt-2 inline-block rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-primary">
                {t.classification}: {classification}
              </span>
            </div>
            <div className="w-full max-w-xs">
              <div className="relative h-2.5 overflow-hidden rounded-full bg-gradient-to-r from-sky-200 via-emerald-200 to-rose-200">
                <span
                  className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-on-background"
                  style={{ left: `${position}%` }}
                />
              </div>
            </div>
          </div>
        </SurfaceCard>

        {result.eligible && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <SurfaceCard>
                <Icon name="trending_down" />
                <h3 className="mt-2 font-semibold text-on-background">{t.goalTitle}</h3>
                <p className="mt-1 text-caption text-on-surface-variant">{t.goalText}</p>
              </SurfaceCard>
              <SurfaceCard>
                <Icon name="my_location" />
                <h3 className="mt-2 font-semibold text-on-background">{t.approachTitle}</h3>
                <p className="mt-1 text-caption text-on-surface-variant">{t.approachText}</p>
              </SurfaceCard>
            </div>
            <Link
              href={`/${locale}/agenda/`}
              className="inline-flex w-full items-center justify-center rounded-[12px] bg-primary-action px-5 py-3 text-sm font-semibold text-white shadow-soft hover:bg-primary-hover"
            >
              {t.next}
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8">
      <SurfaceCard className="space-y-8">
        <section>
          <h2 className="text-headline text-on-background">{t.personal}</h2>
          <div className="mt-4 space-y-4">
            <Field label={t.email}>
              <Input name="email" type="email" required placeholder="seu@email.com" />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label={t.age}>
                <Input name="age" type="number" min={1} max={120} required placeholder="35" />
              </Field>
              <Field label={t.height}>
                <Input name="height" type="number" min={100} max={250} required placeholder="170" />
              </Field>
              <Field label={t.weight}>
                <Input name="weight" type="number" min={30} max={400} required placeholder="75" />
              </Field>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-headline text-on-background">{t.clinical}</h2>
          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-on-surface-variant">{t.comorbidities}</legend>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Object.entries(t.comorbidityOptions).map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-hairline bg-surface-base px-3 py-3 text-sm text-on-surface-variant transition has-[:checked]:border-primary-action has-[:checked]:bg-primary-action/5 has-[:checked]:text-primary"
                >
                  <input
                    type="checkbox"
                    name="comorbidities"
                    value={value}
                    className="size-4 accent-primary-action"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-4 space-y-3 rounded-[12px] bg-surface-container-low p-4">
            <label className="flex items-center justify-between gap-3 text-sm text-on-surface-variant">
              <span>{t.pregnant}</span>
              <input type="checkbox" name="pregnant" className="size-5 accent-primary-action" />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm text-on-surface-variant">
              <span>{t.eatingDisorder}</span>
              <input type="checkbox" name="eatingDisorder" className="size-5 accent-primary-action" />
            </label>
          </div>
        </section>

        {error && <p className="text-sm text-error">{t.error}</p>}
        <Button type="submit" disabled={loading} className="w-full py-3">
          {loading ? "…" : t.submit}
          {!loading && <span aria-hidden>→</span>}
        </Button>
        <p className="text-center text-xs text-outline">{t.lgpdNote}</p>
      </SurfaceCard>
    </form>
  );
}
