"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { configureAuth, getToken, signIn, signOut, signUp, confirmSignUp } from "@/lib/auth";
import type { Dictionary } from "@/lib/i18n";

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
    // Pass submitter so FormData includes the clicked button's name/value
    // (without it, mode is missing and signup always falls through to signin).
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

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-500 focus:outline-none";
  const buttonClass =
    "rounded-lg bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-700 disabled:opacity-50";

  if (stage === "confirming") {
    return (
      <form onSubmit={handleConfirm} className="mt-8 max-w-sm space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          {t.confirmCode}
          <input name="code" required className={inputClass} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className={buttonClass}>
          {t.confirm}
        </button>
      </form>
    );
  }

  if (stage === "signedOut") {
    return (
      <form onSubmit={handleAuth} className="mt-8 max-w-sm space-y-4">
        <p className="text-xs text-slate-500">{t.authNote}</p>
        <label className="block text-sm font-medium text-slate-700">
          {t.email}
          <input name="email" type="email" required className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t.password}
          <input name="password" type="password" required minLength={10} className={inputClass} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" name="mode" value="signin" className={buttonClass}>
            {t.signIn}
          </button>
          <button
            type="submit"
            name="mode"
            value="signup"
            className="rounded-lg border border-teal-600 px-5 py-2.5 font-semibold text-teal-700 hover:bg-teal-50"
          >
            {t.signUp}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="text-right">
        <button
          onClick={() => signOut().then(() => setStage("signedOut"))}
          className="text-sm text-slate-500 underline hover:text-teal-700"
        >
          {t.signOut}
        </button>
      </div>

      {!patient ? (
        <form onSubmit={createPatient} className="space-y-4 rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900">{t.createPatient}</h2>
          <label className="block text-sm font-medium text-slate-700">
            {t.name}
            <input name="name" required className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            {t.email}
            <input name="email" type="email" required className={inputClass} />
          </label>
          <button type="submit" className={buttonClass}>
            {t.createPatient}
          </button>
        </form>
      ) : (
        <>
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-slate-700">
            {patient.name} · {patient.email} · <code className="text-xs">{patient.id}</code>
          </div>

          <section className="rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900">{t.consentTitle}</h2>
            <p className="mt-1 text-sm text-slate-600">{t.consentPurpose}</p>
            <div className="mt-4 flex items-center gap-3">
              <button onClick={() => recordConsent(true)} className={buttonClass}>
                {t.grant}
              </button>
              <button
                onClick={() => recordConsent(false)}
                className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-600 hover:border-red-400 hover:text-red-600"
              >
                {t.revoke}
              </button>
              {consentGranted !== null && (
                <span className={`text-sm ${consentGranted ? "text-teal-700" : "text-red-600"}`}>
                  {consentGranted ? "✓" : "✗"}
                </span>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900">{t.prescriptionTitle}</h2>
            <div className="mt-4 flex items-center gap-3">
              <button onClick={issuePrescription} disabled={consentGranted !== true} className={buttonClass}>
                {t.issue}
              </button>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  download="levecare-demo-prescription.pdf"
                  className="font-semibold text-teal-700 underline"
                >
                  {t.download}
                </a>
              )}
            </div>
          </section>
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
