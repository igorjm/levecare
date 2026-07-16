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
import { EmptyState, LoadingSkeleton } from "@/components/ui/EmptyState";

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function formatDay(iso: string, localeHint: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(localeHint === "en" ? "en-US" : "pt-BR", {
    weekday: "short",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatSummary(iso: string, localeHint: string) {
  return new Date(iso).toLocaleString(localeHint === "en" ? "en-US" : "pt-BR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hourOf(iso: string) {
  return new Date(iso).getUTCHours();
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
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [journey, setJourney] = useState<JourneyState>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    api
      .listSlots()
      .then((res) => setSlots(res.slots))
      .catch(() => setError(true))
      .finally(() => setLoadingSlots(false));
    getToken().then((token) => setAuthed(Boolean(token)));
    const j = loadJourney();
    setJourney(j);
    setName(j.name ?? "");
    setEmail(j.email ?? "");
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

  const morning = times.filter((s) => hourOf(s.startsAt) < 12);
  const afternoon = times.filter((s) => hourOf(s.startsAt) >= 12);

  const selectedSlot = slots.find((s) => s.id === selected) ?? null;
  const selectedProvider = providers.find((p) => p.key === providerKey);

  useEffect(() => {
    if (providers.length && !providerKey) setProviderKey(providers[0].key);
  }, [providers, providerKey]);

  useEffect(() => {
    if (days.length && (!day || !days.some(([k]) => k === day))) setDay(days[0][0]);
  }, [days, day]);

  async function onSubmit() {
    if (!selected || !email) return;
    setError(false);
    setLoading(true);
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
      <SurfaceCard className="mt-8 border-primary-action/30 bg-secondary-container/20 animate-fade-in">
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

  function TimeGrid({ list }: { list: Slot[] }) {
    if (!list.length) return null;
    return (
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {list.map((slot) => {
          const active = selected === slot.id;
          return (
            <button
              type="button"
              key={slot.id}
              onClick={() => setSelected(slot.id)}
              className={`rounded-[12px] border px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "border-primary-action bg-primary-action/10 text-primary"
                  : "border-hairline bg-white text-on-surface hover:border-primary-action/40"
              }`}
            >
              {formatTime(slot.startsAt)}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6 pb-28">
      {authed && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label={t.email}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
        </div>
      )}

      <section>
        <p className="text-label uppercase text-outline">{t.sectionProviders}</p>
        {loadingSlots ? (
          <div className="mt-4">
            <LoadingSkeleton rows={2} />
          </div>
        ) : providers.length === 0 ? (
          <EmptyState icon="event_busy" title={t.noSlots} description={t.error} />
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
          <p className="text-label uppercase text-outline">{t.sectionSchedule}</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
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
                  className={`min-w-[72px] shrink-0 rounded-[12px] border px-3 py-3 text-center text-sm transition ${
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

          <p className="mt-6 text-label uppercase text-outline">{t.sectionTimes}</p>
          {morning.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-on-surface-variant">{t.morning}</p>
              <TimeGrid list={morning} />
            </div>
          )}
          {afternoon.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-on-surface-variant">{t.afternoon}</p>
              <TimeGrid list={afternoon} />
            </div>
          )}
        </section>
      )}

      {authed === false && (
        <AuthCard
          dict={dict}
          defaultEmail={email || journey.email}
          embedded
          onSignedIn={() => {
            setAuthed(true);
            const j = loadJourney();
            if (j.name) setName(j.name);
            if (j.email) setEmail(j.email);
          }}
        />
      )}

      {error && <p className="text-sm text-error">{t.error}</p>}

      {/* Sticky confirmation bar — Stitch Agenda signed-out */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgb(15_23_42/0.06)] backdrop-blur">
        <div className="mx-auto flex max-w-[720px] flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 text-sm">
            {selectedSlot ? (
              <>
                <p className="font-semibold text-on-background">
                  {formatSummary(selectedSlot.startsAt, locale)}
                </p>
                <p className="truncate text-on-surface-variant">{selectedProvider?.provider}</p>
              </>
            ) : (
              <p className="text-on-surface-variant">{t.pick}</p>
            )}
          </div>
          <Button
            type="button"
            disabled={loading || !selected || authed === false || !email}
            className="min-w-[200px]"
            onClick={onSubmit}
          >
            {loading ? "…" : t.submit}
          </Button>
        </div>
      </div>
    </div>
  );
}
