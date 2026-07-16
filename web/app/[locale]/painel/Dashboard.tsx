"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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

function formatDateTime(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale === "en" ? "en-US" : "pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function Dashboard({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.dashboard;
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
  const [busy, setBusy] = useState(false);

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

  // Loads everything derivable from the signed-in user: patient record (by
  // email), consent trail, consultations, prescriptions, and intake result.
  const loadAll = useCallback(async () => {
    setError(null);
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

    // Patient record: 404 just means "not created yet".
    try {
      const found = await api.findPatientByEmail(userEmail, token);
      setPatient(found);
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404)) {
        setError(e instanceof Error ? e.message : "request error");
      }
    } finally {
      setPatientChecked(true);
    }

    api
      .listBookings(token)
      .then((res) => setBookings(res.bookings))
      .catch(() => undefined);

    if (j.intakeId) {
      api
        .getIntake(j.intakeId)
        .then(setIntake)
        .catch(() => undefined);
    }
  }, []);

  // Consent + prescriptions depend on the patient record.
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

  async function cancelBooking(id: string) {
    setError(null);
    const cancelled = await withToken((token) => api.cancelBooking(id, token));
    if (cancelled) {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
    }
  }

  if (stage === "loading") {
    return <p className="mt-12 text-center text-body-md text-on-surface-variant">{t.loading}</p>;
  }

  if (stage === "signedOut") {
    return (
      <div className="mt-10">
        <AuthCard dict={dict} defaultEmail={journey.email ?? loadJourney().email} onSignedIn={loadAll} />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {patient ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white px-4 py-2 text-sm text-on-surface-variant shadow-soft">
            <span className="size-2 rounded-full bg-primary-action" />
            {t.patientIdentified}: <strong className="text-on-background">{patient.name}</strong>
            <span className="text-outline">· {patient.email}</span>
          </div>
        ) : (
          <span className="text-sm text-on-surface-variant">{email}</span>
        )}
        <button
          type="button"
          onClick={() => signOut().then(() => setStage("signedOut"))}
          className="text-sm text-on-surface-variant underline hover:text-primary"
        >
          {t.signOut}
        </button>
      </div>

      {!patient && patientChecked && (
        <SurfaceCard>
          <h2 className="text-headline text-on-background">{t.createPatient}</h2>
          <p className="mt-1 text-caption text-on-surface-variant">{t.createHint}</p>
          <form onSubmit={createPatient} className="mt-4 space-y-4">
            <Field label={t.name}>
              <Input
                key={`name-${journey.name ?? ""}`}
                name="name"
                defaultValue={journey.name}
                required
              />
            </Field>
            <Field label={t.email}>
              <Input name="email" type="email" defaultValue={email ?? ""} readOnly required />
            </Field>
            <Button type="submit">{t.createPatient}</Button>
          </form>
        </SurfaceCard>
      )}

      {intake && (
        <SurfaceCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-3">
              <Icon name="assignment" className="text-[28px]" />
              <div>
                <h2 className="text-headline text-on-background">{t.intakeTitle}</h2>
                <p className="mt-1 text-caption text-on-surface-variant">
                  {dict.intake.bmi}: <strong>{intake.bmi.toFixed(1)}</strong> ·{" "}
                  {intake.eligible ? t.intakeEligible : t.intakeNotEligible}
                </p>
              </div>
            </div>
            <Link href={`/${locale}/avaliacao/`} className="text-sm font-semibold text-primary underline">
              {t.redoIntake}
            </Link>
          </div>
        </SurfaceCard>
      )}

      {patient && (
        <SurfaceCard>
          <div className="flex gap-3">
            <Icon name="shield" className="text-[28px]" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-headline text-on-background">{t.consentTitle}</h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                    consentGranted
                      ? "bg-secondary-container/40 text-primary"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${consentGranted ? "bg-primary-action" : "bg-outline"}`}
                  />
                  {consentGranted ? t.consentActive : t.consentInactive}
                </span>
              </div>
              <p className="mt-1 text-caption text-on-surface-variant">{t.consentPurpose}</p>
              <p className="mt-2 text-sm text-on-surface-variant">{t.consentHint}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button type="button" onClick={() => recordConsent(true)} disabled={consentGranted === true}>
                  {t.grant}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => recordConsent(false)}
                  disabled={consentGranted !== true}
                >
                  {t.revoke}
                </Button>
              </div>
            </div>
          </div>
        </SurfaceCard>
      )}

      <SurfaceCard>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-3">
            <Icon name="event" className="text-[28px]" />
            <h2 className="text-headline text-on-background">{t.consultationsTitle}</h2>
          </div>
          <Link href={`/${locale}/agenda/`} className="text-sm font-semibold text-primary underline">
            {t.bookNow}
          </Link>
        </div>
        {bookings.length === 0 ? (
          <p className="mt-4 text-caption text-outline">{t.noBookings}</p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline">
            {bookings.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold text-on-background">{b.provider}</p>
                  <p className="text-caption text-on-surface-variant">
                    {formatDateTime(b.startsAt, locale)}
                    {b.crm ? ` · CRM ${b.crm}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      b.status === "cancelled"
                        ? "bg-surface-container text-outline line-through"
                        : "bg-secondary-container/40 text-primary"
                    }`}
                  >
                    {b.status === "cancelled" ? t.statusCancelled : t.statusConfirmed}
                  </span>
                  {b.status !== "cancelled" && (
                    <Button type="button" variant="danger" onClick={() => cancelBooking(b.id)}>
                      {t.cancelBooking}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SurfaceCard>

      {patient && (
        <SurfaceCard>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="flex gap-3">
                <Icon name="description" className="text-[28px]" />
                <div>
                  <h2 className="text-headline text-on-background">{t.prescriptionsTitle}</h2>
                  <p className="mt-1 text-caption text-on-surface-variant">{t.prescriptionHint}</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <Button type="button" onClick={issuePrescription} disabled={busy || consentGranted !== true}>
                  {busy ? "…" : t.issue}
                </Button>
                {consentGranted !== true && (
                  <p className="text-sm font-medium text-error">{t.requiresConsent}</p>
                )}
                {prescriptions.length === 0 ? (
                  <p className="text-caption text-outline">{t.noPrescriptions}</p>
                ) : (
                  <ul className="divide-y divide-hairline">
                    {prescriptions.map((rx) => (
                      <li key={rx.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <p className="text-sm text-on-surface-variant">
                          {t.issuedAtLabel} {formatDateTime(rx.issuedAt, locale)}
                        </p>
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
              </div>
            </div>
            <div className="relative min-h-[180px] overflow-hidden rounded-[12px] border border-hairline bg-surface-base p-4">
              <div className="space-y-2 opacity-40">
                <div className="h-2 w-3/4 rounded bg-outline-variant" />
                <div className="h-2 w-full rounded bg-outline-variant" />
                <div className="h-2 w-5/6 rounded bg-outline-variant" />
                <div className="mt-6 h-2 w-2/3 rounded bg-outline-variant" />
                <div className="h-2 w-full rounded bg-outline-variant" />
              </div>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="-rotate-12 border-2 border-disclaimer/60 px-3 py-1 text-sm font-bold tracking-widest text-disclaimer/80">
                  {t.demoWatermark}
                </span>
              </div>
            </div>
          </div>
        </SurfaceCard>
      )}

      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
