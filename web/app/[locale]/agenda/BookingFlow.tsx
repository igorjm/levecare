"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, type Slot } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { loadJourney, saveJourney, type JourneyState } from "@/lib/journey";
import type { Dictionary } from "@/lib/i18n";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { Icon } from "@/components/ui/DemoBadge";

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function formatDay(iso: string, localeHint: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(localeHint === "en" ? "en-US" : "pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function BookingFlow({ dict, locale }: { dict: Dictionary; locale: string }) {
  const t = dict.booking;
  const [slots, setSlots] = useState<Slot[]>([]);
  const [providerKey, setProviderKey] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [journey, setJourney] = useState<JourneyState>({});

  useEffect(() => {
    api
      .listSlots()
      .then((res) => setSlots(res.slots))
      .catch(() => setError(true));
    getToken().then((token) => setAuthed(Boolean(token)));
    setJourney(loadJourney());
  }, []);

  const providers = useMemo(() => {
    const map = new Map<string, { key: string; provider: string; crm: string }>();
    for (const slot of slots) {
      const key = `${slot.provider}|${slot.crm}`;
      if (!map.has(key)) map.set(key, { key, provider: slot.provider, crm: slot.crm });
    }
    return [...map.values()];
  }, [slots]);

  const providerSlots = useMemo(
    () => (providerKey ? slots.filter((s) => `${s.provider}|${s.crm}` === providerKey) : []),
    [slots, providerKey],
  );

  const days = useMemo(() => {
    const set = new Map<string, string>();
    for (const slot of providerSlots) {
      const key = dayKey(slot.startsAt);
      if (!set.has(key)) set.set(key, slot.startsAt);
    }
    return [...set.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [providerSlots]);

  const times = useMemo(
    () =>
      providerSlots
        .filter((s) => dayKey(s.startsAt) === day)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [providerSlots, day],
  );

  useEffect(() => {
    if (providers.length && !providerKey) setProviderKey(providers[0].key);
  }, [providers, providerKey]);

  useEffect(() => {
    if (days.length && (!day || !days.some(([k]) => k === day))) setDay(days[0][0]);
  }, [days, day]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setError(false);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const name = String(form.get("name"));
    try {
      const token = await getToken();
      if (!token) {
        setAuthed(false);
        throw new Error("not authenticated");
      }
      await api.book({ slotId: selected, email, name, intakeId: journey.intakeId }, token);
      saveJourney({ email, name });
      setConfirmed(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (confirmed) {
    return (
      <SurfaceCard className="mt-8 border-primary-action/30 bg-secondary-container/20">
        <Icon name="check_circle" className="text-[32px] text-primary" />
        <h2 className="mt-3 text-headline text-on-background">{t.confirmed}</h2>
        <p className="mt-2 text-body-md text-on-surface-variant">{t.confirmedText}</p>
        <Link
          href={`/${locale}/painel/`}
          className="mt-4 inline-flex items-center gap-2 font-semibold text-primary underline"
        >
          {t.goDashboard}
          <span aria-hidden>→</span>
        </Link>
      </SurfaceCard>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.name}>
          <Input key={`name-${journey.name ?? ""}`} name="name" defaultValue={journey.name} required />
        </Field>
        <Field label={t.email}>
          <Input
            key={`email-${journey.email ?? ""}`}
            name="email"
            type="email"
            defaultValue={journey.email}
            required
          />
        </Field>
      </div>

      <section>
        <h2 className="border-b border-hairline pb-2 text-headline text-on-background">
          {t.sectionProviders}
        </h2>
        {providers.length === 0 && !error ? (
          <p className="mt-4 text-caption text-outline">{t.noSlots}</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {providers.map((p) => {
              const active = providerKey === p.key;
              return (
                <button
                  type="button"
                  key={p.key}
                  onClick={() => {
                    setProviderKey(p.key);
                    setSelected(null);
                  }}
                  className={`relative rounded-[16px] border p-4 text-left transition ${
                    active
                      ? "border-primary-action bg-primary-action/5 shadow-soft"
                      : "border-hairline bg-white hover:border-primary-action/40"
                  }`}
                >
                  {active && (
                    <span className="absolute right-3 top-3 text-primary-action">
                      <Icon name="check_circle" className="text-[20px]" />
                    </span>
                  )}
                  <p className="font-display text-lg font-semibold text-on-background">{p.provider}</p>
                  <p className="mt-1 text-caption text-on-surface-variant">CRM {p.crm}</p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {providerKey && days.length > 0 && (
        <section>
          <h2 className="border-b border-hairline pb-2 text-headline text-on-background">
            {t.sectionSchedule}
          </h2>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {days.map(([key, sample]) => {
              const active = day === key;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => {
                    setDay(key);
                    setSelected(null);
                  }}
                  className={`min-w-[88px] shrink-0 rounded-[12px] border px-3 py-3 text-center text-sm transition ${
                    active
                      ? "border-primary-action bg-primary-action text-white"
                      : "border-hairline bg-white text-on-surface-variant hover:border-primary-action/40"
                  }`}
                >
                  {formatDay(sample, locale)}
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {times.map((slot) => {
              const active = selected === slot.id;
              return (
                <button
                  type="button"
                  key={slot.id}
                  onClick={() => setSelected(slot.id)}
                  className={`rounded-[12px] border px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "border-primary-action bg-primary-action text-white"
                      : "border-hairline bg-white text-on-surface hover:border-primary-action/40"
                  }`}
                >
                  {formatTime(slot.startsAt)}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {authed === false && (
        <section className="space-y-4">
          <div className="flex gap-3 rounded-[12px] border border-hairline bg-surface-container-low p-4 text-sm text-on-surface-variant">
            <Icon name="info" />
            <p>{t.authInline}</p>
          </div>
          <AuthCard dict={dict} defaultEmail={journey.email} onSignedIn={() => setAuthed(true)} />
        </section>
      )}

      {error && <p className="text-sm text-error">{t.error}</p>}

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="ghost" onClick={() => setSelected(null)}>
          {t.cancel}
        </Button>
        <Button type="submit" disabled={loading || !selected || authed === false} className="min-w-[200px]">
          {loading ? "…" : t.submit}
          {!loading && <span aria-hidden>→</span>}
        </Button>
      </div>
    </form>
  );
}
