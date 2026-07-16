"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  api,
  ApiError,
  type Booking,
  type IntakeResult,
  type Patient,
  type PrescriptionEntry,
} from "@/lib/api";
import { configureAuth, getToken, getUserEmail, signOut } from "@/lib/auth";
import { loadJourney, saveJourney, type JourneyState } from "@/lib/journey";
import type { Dictionary, Locale } from "@/lib/i18n";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { Icon } from "@/components/ui/DemoBadge";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  StatusChip,
} from "@/components/ui/EmptyState";

type Stage = "loading" | "signedOut" | "signedIn";

function downloadPdf(pdfBase64: string, filename: string) {
  const bytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function monthShort(iso: string, locale: string) {
  return new Date(iso)
    .toLocaleDateString(locale === "en" ? "en-US" : "pt-BR", { month: "short" })
    .replace(".", "")
    .toUpperCase();
}

function dayNum(iso: string) {
  return new Date(iso).getDate();
}

function formatDateTime(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale === "en" ? "en-US" : "pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function Dashboard({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.dashboard;
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [journey, setJourney] = useState<JourneyState>({});
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientChecked, setPatientChecked] = useState(false);
  const [consentGranted, setConsentGranted] = useState<boolean | null>(null);
  const [intake, setIntake] = useState<IntakeResult | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const withToken = useCallback(async <T,>(fn: (token: string) => Promise<T>): Promise<T | null> => {
    const token = await getToken();
    if (!token) {
      setStage("signedOut");
      return null;
    }
    try {
      return await fn(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "request error");
      return null;
    }
  }, []);

  const loadAll = useCallback(async () => {
    setError(null);
    setLoadFailed(false);
    const userEmail = await getUserEmail();
    if (!userEmail) {
      setStage("signedOut");
      return;
    }
    setEmail(userEmail);
    setStage("signedIn");
    const j = loadJourney();
    setJourney(j);

    const token = await getToken();
    if (!token) return;

    try {
      const found = await api.findPatientByEmail(userEmail, token);
      setPatient(found);
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404)) {
        setLoadFailed(true);
        setError(e instanceof Error ? e.message : "request error");
      }
    } finally {
      setPatientChecked(true);
    }

    try {
      const res = await api.listBookings(token);
      setBookings(res.bookings);
    } catch {
      /* bookings optional on first visit */
    }

    if (j.intakeId) {
      api
        .getIntake(j.intakeId)
        .then(setIntake)
        .catch(() => undefined);
    }
  }, []);

  const loadPatientDetails = useCallback(async (patientId: string) => {
    const token = await getToken();
    if (!token) return;
    api
      .listConsents(patientId, token)
      .then((consents) => {
        if (consents.length === 0) return;
        const latest = [...consents].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)).at(-1);
        setConsentGranted(latest?.granted ?? null);
      })
      .catch(() => undefined);
    api
      .listPrescriptions(patientId, token)
      .then(setPrescriptions)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    configureAuth();
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (patient) loadPatientDetails(patient.id);
  }, [patient, loadPatientDetails]);

  const upcoming = useMemo(
    () => bookings.filter((b) => b.status !== "cancelled"),
    [bookings],
  );
  const history = useMemo(
    () => bookings.filter((b) => b.status === "cancelled"),
    [bookings],
  );
  const cancelTarget = bookings.find((b) => b.id === cancelId) ?? null;

  async function createPatient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    const created = await withToken((token) =>
      api.createPatient({ name, email: email ?? String(form.get("email")) }, token),
    );
    if (created) {
      saveJourney({ name });
      setPatient(created);
    }
  }

  async function recordConsent(granted: boolean) {
    if (!patient) return;
    setError(null);
    const ok = await withToken((token) =>
      api.recordConsent(patient.id, { purpose: t.consentPurpose, granted }, token),
    );
    if (ok !== null) setConsentGranted(granted);
  }

  async function issuePrescription() {
    if (!patient) return;
    setError(null);
    setBusy(true);
    const res = await withToken((token) => api.issuePrescription(patient.id, token));
    setBusy(false);
    if (res) {
      downloadPdf(res.pdfBase64, "levecare-demo-prescription.pdf");
      setPrescriptions((prev) => [
        { id: res.id, patientId: res.patientId, issuedAt: res.issuedAt },
        ...prev,
      ]);
    }
  }

  async function redownload(rxId: string) {
    if (!patient) return;
    setError(null);
    const res = await withToken((token) => api.getPrescription(patient.id, rxId, token));
    if (res) downloadPdf(res.pdfBase64, "levecare-demo-prescription.pdf");
  }

  async function confirmCancel() {
    if (!cancelId) return;
    const id = cancelId;
    setCancelId(null);
    const cancelled = await withToken((token) => api.cancelBooking(id, token));
    if (cancelled) {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
    }
  }

  if (stage === "loading") {
    return (
      <div className="mt-12 space-y-4">
        <p className="text-center text-body-md text-on-surface-variant">{t.loading}</p>
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (stage === "signedOut") {
    return (
      <div className="mt-10">
        <AuthCard dict={dict} defaultEmail={journey.email ?? loadJourney().email} onSignedIn={loadAll} />
      </div>
    );
  }

  if (loadFailed) {
    return (
      <SurfaceCard className="mt-10">
        <ErrorState
          title={t.loadErrorTitle}
          description={t.loadErrorText}
          retryLabel={t.retry}
          onRetry={loadAll}
        />
      </SurfaceCard>
    );
  }

  const displayName = patient?.name ?? journey.name ?? email ?? "";

  return (
    <div className="mt-8 space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-label uppercase text-outline">{t.subtitle}</p>
        <button
          type="button"
          onClick={() => signOut().then(() => setStage("signedOut"))}
          className="text-sm text-on-surface-variant underline hover:text-primary"
        >
          {t.signOut}
        </button>
      </div>

      {/* Patient identity — Stitch Painel v2 header */}
      {(patient || email) && (
        <SurfaceCard className="flex flex-wrap items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white">
            {patient ? initials(patient.name) : "·"}
          </div>
          <div className="min-w-0">
            <p className="font-display text-xl font-semibold text-on-background">{displayName}</p>
            <p className="truncate text-sm text-on-surface-variant">{patient?.email ?? email}</p>
            {patient && (
              <p className="mt-0.5 text-xs text-outline">
                {t.patientIdLabel}: {patient.id.slice(0, 8)}
              </p>
            )}
          </div>
        </SurfaceCard>
      )}

      {!patient && patientChecked && (
        <SurfaceCard>
          <h2 className="text-headline text-on-background">{t.createPatient}</h2>
          <p className="mt-1 text-caption text-on-surface-variant">{t.createHint}</p>
          <form onSubmit={createPatient} className="mt-4 space-y-4">
            <Field label={t.name}>
              <Input key={`name-${journey.name ?? ""}`} name="name" defaultValue={journey.name} required />
            </Field>
            <Field label={t.email}>
              <Input name="email" type="email" defaultValue={email ?? ""} readOnly required />
            </Field>
            <Button type="submit">{t.createPatient}</Button>
          </form>
        </SurfaceCard>
      )}

      {patient && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            {intake && (
              <SurfaceCard>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <Icon name="monitor_weight" className="text-[28px]" />
                    <div>
                      <h2 className="text-headline text-on-background">{t.intakeTitle}</h2>
                      <p className="mt-3 text-caption text-on-surface-variant">{t.intakeBmi}</p>
                      <p className="font-display text-4xl font-bold text-on-background">
                        {intake.bmi.toFixed(1)}{" "}
                        <span className="text-lg font-semibold text-on-surface-variant">kg/m²</span>
                      </p>
                    </div>
                  </div>
                  <StatusChip tone={intake.eligible ? "success" : "neutral"}>
                    {intake.eligible ? t.intakeEligible : t.intakeNotEligible}
                  </StatusChip>
                </div>
                <Link
                  href={`/${locale}/avaliacao/`}
                  className="mt-4 inline-block text-sm font-semibold text-primary underline"
                >
                  {t.redoIntake}
                </Link>
              </SurfaceCard>
            )}

            <SurfaceCard>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-3">
                  <Icon name="calendar_month" className="text-[28px]" />
                  <div>
                    <h2 className="text-headline text-on-background">{t.consultationsTitle}</h2>
                    <p className="text-caption text-on-surface-variant">{t.consultationsSubtitle}</p>
                  </div>
                </div>
                <Link href={`/${locale}/agenda/`} className="text-sm font-semibold text-primary underline">
                  {t.bookNow}
                </Link>
              </div>

              {upcoming.length === 0 && history.length === 0 ? (
                <EmptyState
                  icon="event_busy"
                  title={t.noBookings}
                  description={t.noBookingsHint}
                  actionLabel={t.bookNow}
                  onAction={() => router.push(`/${locale}/agenda/`)}
                />
              ) : (
                <div className="mt-4 space-y-5">
                  {upcoming.length > 0 && (
                    <div>
                      <p className="text-label uppercase text-outline">{t.upcoming}</p>
                      <ul className="mt-2 space-y-3">
                        {upcoming.map((b) => (
                          <li
                            key={b.id}
                            className="flex flex-wrap items-center gap-3 rounded-[12px] border border-hairline p-3"
                          >
                            <div className="flex size-14 flex-col items-center justify-center rounded-[10px] bg-primary text-white">
                              <span className="text-[10px] font-semibold uppercase leading-none">
                                {monthShort(b.startsAt, locale)}
                              </span>
                              <span className="text-xl font-bold leading-none">{dayNum(b.startsAt)}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-on-background">{b.provider}</p>
                              <p className="text-caption text-on-surface-variant">
                                {b.crm ? `CRM ${b.crm} · ` : ""}
                                {formatTime(b.startsAt)} — {t.videoConsult}
                              </p>
                            </div>
                            <StatusChip tone="success">{t.statusConfirmed}</StatusChip>
                            <Button type="button" variant="danger" onClick={() => setCancelId(b.id)}>
                              {t.cancelBooking}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {history.length > 0 && (
                    <div>
                      <p className="text-label uppercase text-outline">{t.recentHistory}</p>
                      <ul className="mt-2 space-y-3">
                        {history.map((b) => (
                          <li
                            key={b.id}
                            className="flex flex-wrap items-center gap-3 rounded-[12px] border border-hairline p-3 opacity-70"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-on-background line-through">{b.provider}</p>
                              <p className="text-caption text-on-surface-variant">
                                {formatDateTime(b.startsAt, locale)}
                              </p>
                            </div>
                            <StatusChip tone="neutral">{t.statusCancelled}</StatusChip>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </SurfaceCard>
          </div>

          <div className="space-y-6">
            <SurfaceCard>
              <div className="flex gap-3">
                <Icon name="shield_lock" className="text-[28px]" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-headline text-on-background">{t.consentTitle}</h2>
                    <StatusChip tone={consentGranted ? "success" : "neutral"}>
                      <span
                        className={`size-1.5 rounded-full ${consentGranted ? "bg-primary-action" : "bg-outline"}`}
                      />
                      {consentGranted ? t.consentActive : t.consentInactive}
                    </StatusChip>
                  </div>
                  <p className="mt-2 text-sm text-on-surface-variant">{t.consentHint}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      onClick={() => recordConsent(true)}
                      disabled={consentGranted === true}
                    >
                      {t.grant}
                    </Button>
                    {consentGranted === true && (
                      <button
                        type="button"
                        onClick={() => recordConsent(false)}
                        className="text-sm font-medium text-error underline"
                      >
                        {t.revoke}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <div className="flex gap-3">
                <Icon name="medication" className="text-[28px]" />
                <div>
                  <h2 className="text-headline text-on-background">{t.prescriptionsTitle}</h2>
                  <p className="mt-1 text-caption text-on-surface-variant">{t.prescriptionHint}</p>
                </div>
              </div>

              {prescriptions.length === 0 ? (
                <div className="mt-2">
                  <EmptyState
                    icon="history"
                    title={t.noPrescriptions}
                    description={t.noPrescriptionsHint}
                  />
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-hairline">
                  {prescriptions.map((rx) => (
                    <li key={rx.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3">
                        <Icon name="description" />
                        <p className="text-sm text-on-surface-variant">
                          {t.issuedAtLabel} {formatDateTime(rx.issuedAt, locale)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => redownload(rx.id)}
                        className="text-sm font-semibold text-primary underline"
                      >
                        {t.redownload}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 space-y-2">
                <Button
                  type="button"
                  className="w-full"
                  onClick={issuePrescription}
                  disabled={busy || consentGranted !== true}
                >
                  <Icon name="science" className="text-[18px] text-inherit" />
                  {busy ? "…" : t.issue}
                </Button>
                {consentGranted !== true && (
                  <p className="text-center text-sm font-medium text-error">{t.requiresConsent}</p>
                )}
              </div>
            </SurfaceCard>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      <ConfirmDialog
        open={Boolean(cancelId)}
        title={t.cancelConfirmTitle}
        description={
          cancelTarget
            ? `${t.cancelConfirmText} (${cancelTarget.provider} · ${formatDateTime(cancelTarget.startsAt, locale)})`
            : t.cancelConfirmText
        }
        confirmLabel={t.cancelConfirm}
        cancelLabel={t.cancelKeep}
        onConfirm={confirmCancel}
        onCancel={() => setCancelId(null)}
      />
    </div>
  );
}
