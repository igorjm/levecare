"use client";

import { useState } from "react";
import Link from "next/link";
import { api, type IntakeResult } from "@/lib/api";
import type { Dictionary, Locale } from "@/lib/i18n";

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
    try {
      const res = await api.submitIntake({
        email: String(form.get("email")),
        age: Number(form.get("age")),
        heightCm: Number(form.get("height")),
        weightKg: Number(form.get("weight")),
        comorbidities: form.getAll("comorbidities").map(String),
        pregnant: form.get("pregnant") === "on",
        eatingDisorderHistory: form.get("eatingDisorder") === "on",
      });
      setResult(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div
        className={`mt-8 rounded-xl border p-6 ${
          result.eligible ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-slate-50"
        }`}
      >
        <h2 className="text-xl font-semibold text-slate-900">
          {result.eligible ? t.eligible : t.notEligible}
        </h2>
        <p className="mt-2 text-slate-600">{result.eligible ? t.eligibleText : t.notEligibleText}</p>
        <p className="mt-3 text-sm text-slate-500">
          {t.bmi}: <strong>{result.bmi}</strong>
        </p>
        {result.eligible && (
          <Link
            href={`/${locale}/agenda/`}
            className="mt-5 inline-block rounded-lg bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-700"
          >
            {t.next}
          </Link>
        )}
      </div>
    );
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-500 focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <label className="block text-sm font-medium text-slate-700">
        {t.email}
        <input name="email" type="email" required className={inputClass} />
      </label>
      <div className="grid grid-cols-3 gap-4">
        <label className="block text-sm font-medium text-slate-700">
          {t.age}
          <input name="age" type="number" min={1} max={120} required className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t.height}
          <input name="height" type="number" min={100} max={250} required className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t.weight}
          <input name="weight" type="number" min={30} max={400} required className={inputClass} />
        </label>
      </div>
      <fieldset>
        <legend className="text-sm font-medium text-slate-700">{t.comorbidities}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {Object.entries(t.comorbidityOptions).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="comorbidities" value={value} className="accent-teal-600" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" name="pregnant" className="accent-teal-600" /> {t.pregnant}
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" name="eatingDisorder" className="accent-teal-600" /> {t.eatingDisorder}
      </label>
      {error && <p className="text-sm text-red-600">{t.error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {loading ? "…" : t.submit}
      </button>
    </form>
  );
}
