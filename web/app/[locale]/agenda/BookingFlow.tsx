"use client";

import { useEffect, useState } from "react";
import { api, type Slot } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Dictionary } from "@/lib/i18n";

export function BookingFlow({ dict }: { dict: Dictionary }) {
  const t = dict.booking;
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .listSlots()
      .then((res) => setSlots(res.slots))
      .catch(() => setError(true));
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setError(false);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const token = await getToken();
      if (!token) throw new Error("not authenticated");
      await api.book(
        { slotId: selected, email: String(form.get("email")), name: String(form.get("name")) },
        token,
      );
      setConfirmed(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (confirmed) {
    return (
      <div className="mt-8 rounded-xl border border-teal-300 bg-teal-50 p-6">
        <h2 className="text-xl font-semibold text-slate-900">{t.confirmed}</h2>
        <p className="mt-2 text-slate-600">{t.confirmedText}</p>
      </div>
    );
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-500 focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          {t.name}
          <input name="name" required className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t.email}
          <input name="email" type="email" required className={inputClass} />
        </label>
      </div>
      <fieldset>
        <legend className="text-sm font-medium text-slate-700">{t.pick}</legend>
        <div className="mt-2 grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
          {slots.map((slot) => (
            <button
              type="button"
              key={slot.id}
              onClick={() => setSelected(slot.id)}
              className={`rounded-lg border p-3 text-left text-sm ${
                selected === slot.id
                  ? "border-teal-500 bg-teal-50"
                  : "border-slate-200 hover:border-teal-300"
              }`}
            >
              <span className="block font-medium text-slate-800">
                {new Date(slot.startsAt).toLocaleString()}
              </span>
              <span className="text-slate-500">
                {slot.provider} · {slot.crm}
              </span>
            </button>
          ))}
        </div>
      </fieldset>
      {error && <p className="text-sm text-red-600">{t.error}</p>}
      <button
        type="submit"
        disabled={loading || !selected}
        className="w-full rounded-lg bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {loading ? "…" : t.submit}
      </button>
    </form>
  );
}
