"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { configureAuth, getToken, signIn, signOut, signUp, confirmSignUp } from "@/lib/auth";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { Icon } from "@/components/ui/DemoBadge";

type AuthStage = "signedOut" | "confirming" | "signedIn";

export function Dashboard({ dict }: { dict: Dictionary }) {
  const t = dict.dashboard;
  const [stage, setStage] = useState<AuthStage>("signedOut");
  const [pendingEmail, setPendingEmail] = useState("");
  const [patient, setPatient] = useState<{ id: string; name: string; email: string } | null>(null);
  const [consentGranted, setConsentGranted] = useState<boolean | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    configureAuth();
    getToken().then((token) => {
      if (token) setStage("signedIn");
    });
  }, []);

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const form = new FormData(event.currentTarget, submitter ?? undefined);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const mode = String(form.get("mode") ?? submitter?.value ?? "signin");
    try {
      if (mode === "signup") {
        await signUp({ username: email, password, options: { userAttributes: { email } } });
        setPendingEmail(email);
        setStage("confirming");
      } else {
        await signIn({ username: email, password });
        setStage("signedIn");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "auth error");
    }
  }

  async function handleConfirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await confirmSignUp({ username: pendingEmail, confirmationCode: String(form.get("code")) });
      setStage("signedOut");
    } catch (e) {
      setError(e instanceof Error ? e.message : "confirmation error");
    }
  }

  async function withToken<T>(fn: (token: string) => Promise<T>): Promise<T | null> {
    setError(null);
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
  }

  async function createPatient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const created = await withToken((token) =>
      api.createPatient({ name: String(form.get("name")), email: String(form.get("email")) }, token),
    );
    if (created) setPatient(created);
  }

  async function recordConsent(granted: boolean) {
    if (!patient) return;
    const ok = await withToken((token) =>
      api.recordConsent(patient.id, { purpose: t.consentPurpose, granted }, token),
    );
    if (ok !== null) setConsentGranted(granted);
  }

  async function issuePrescription() {
    if (!patient) return;
    const res = await withToken((token) => api.issuePrescription(patient.id, token));
    if (res) {
      const bytes = Uint8Array.from(atob(res.pdfBase64), (c) => c.charCodeAt(0));
      setPdfUrl(URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })));
    }
  }

  if (stage === "confirming") {
    return (
      <SurfaceCard className="mx-auto mt-10 max-w-md space-y-5">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-primary">LeveCare</h2>
          <p className="mt-1 text-caption text-on-surface-variant">{t.confirmCode}</p>
        </div>
        <form onSubmit={handleConfirm} className="space-y-4">
          <Field label={t.confirmCode}>
            <Input name="code" required autoComplete="one-time-code" />
          </Field>
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full">
            {t.confirm}
          </Button>
        </form>
      </SurfaceCard>
    );
  }

  if (stage === "signedOut") {
    return (
      <SurfaceCard className="mx-auto mt-10 max-w-md space-y-5">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-primary">LeveCare</h2>
          <p className="mt-1 text-caption text-on-surface-variant">{t.subtitle}</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <Field label={t.email}>
            <Input name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label={t.password}>
            <Input name="password" type="password" required minLength={10} autoComplete="current-password" />
          </Field>
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" name="mode" value="signin" className="flex-1">
              {t.authCta}
              <span aria-hidden>→</span>
            </Button>
            <Button type="submit" name="mode" value="signup" variant="secondary" className="flex-1">
              {t.signUp}
            </Button>
          </div>
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-1 text-xs text-on-surface-variant">
              <Icon name="verified_user" className="text-[16px]" />
              {t.authNote}
            </span>
          </div>
          <p className="text-center text-caption text-outline">{t.newAccount}</p>
        </form>
      </SurfaceCard>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => signOut().then(() => setStage("signedOut"))}
          className="text-sm text-on-surface-variant underline hover:text-primary"
        >
          {t.signOut}
        </button>
      </div>

      {!patient ? (
        <SurfaceCard>
          <h2 className="text-headline text-on-background">{t.createPatient}</h2>
          <form onSubmit={createPatient} className="mt-4 space-y-4">
            <Field label={t.name}>
              <Input name="name" required />
            </Field>
            <Field label={t.email}>
              <Input name="email" type="email" required />
            </Field>
            <Button type="submit">{t.createPatient}</Button>
          </form>
        </SurfaceCard>
      ) : (
        <>
          <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white px-4 py-2 text-sm text-on-surface-variant shadow-soft">
            <span className="size-2 rounded-full bg-primary-action" />
            {t.patientIdentified}: <strong className="text-on-background">{patient.name}</strong>
            <span className="text-outline">· {patient.email}</span>
          </div>

          <SurfaceCard>
            <div className="flex gap-3">
              <Icon name="shield" className="text-[28px]" />
              <div className="flex-1">
                <h2 className="text-headline text-on-background">{t.consentTitle}</h2>
                <p className="mt-1 text-caption text-on-surface-variant">{t.consentPurpose}</p>
                <p className="mt-2 text-sm text-on-surface-variant">{t.consentHint}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button type="button" onClick={() => recordConsent(true)}>
                    {t.grant}
                  </Button>
                  <Button type="button" variant="danger" onClick={() => recordConsent(false)}>
                    {t.revoke}
                  </Button>
                  {consentGranted !== null && (
                    <span className={`text-sm font-medium ${consentGranted ? "text-primary" : "text-error"}`}>
                      {consentGranted ? "✓" : "✗"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="flex gap-3">
                  <Icon name="description" className="text-[28px]" />
                  <div>
                    <h2 className="text-headline text-on-background">{t.prescriptionTitle}</h2>
                    <p className="mt-1 text-caption text-on-surface-variant">{t.prescriptionHint}</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  <Button type="button" onClick={issuePrescription} disabled={consentGranted !== true}>
                    {t.issue}
                  </Button>
                  {consentGranted !== true && (
                    <p className="text-sm font-medium text-error">{t.requiresConsent}</p>
                  )}
                  {pdfUrl && (
                    <a href={pdfUrl} download="levecare-demo-prescription.pdf" className="block font-semibold text-primary underline">
                      {t.download}
                    </a>
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
        </>
      )}
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
