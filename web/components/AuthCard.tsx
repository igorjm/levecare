"use client";

import { useState } from "react";
import {
  configureAuth,
  signIn,
  signUp,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  mapAuthError,
} from "@/lib/auth";
import { saveJourney } from "@/lib/journey";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { Icon } from "@/components/ui/DemoBadge";

type AuthMode = "signin" | "signup" | "confirming" | "forgot" | "reset";

export function AuthCard({
  dict,
  defaultEmail = "",
  embedded = false,
  onSignedIn,
}: {
  dict: Dictionary;
  defaultEmail?: string;
  /** Compact variant for Agenda inline auth (tabs + lavender panel). */
  embedded?: boolean;
  onSignedIn: () => void;
}) {
  const t = dict.auth;
  const [mode, setMode] = useState<AuthMode>("signin");
  const [pendingEmail, setPendingEmail] = useState(defaultEmail);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  configureAuth();

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    try {
      await signIn({ username: email, password });
      onSignedIn();
    } catch (e) {
      setError(mapAuthError(e, t));
    }
  }

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const name = String(form.get("name") ?? "");
    try {
      await signUp({
        username: email,
        password,
        options: { userAttributes: { email, ...(name ? { name } : {}) } },
      });
      if (name) saveJourney({ name, email });
      else saveJourney({ email });
      setPendingEmail(email);
      setMode("confirming");
      setNotice(t.codeSentNote);
    } catch (e) {
      setError(mapAuthError(e, t));
    }
  }

  async function handleConfirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await confirmSignUp({ username: pendingEmail, confirmationCode: String(form.get("code")) });
      setMode("signin");
      setNotice(t.confirmedNote);
    } catch (e) {
      setError(mapAuthError(e, t));
    }
  }

  async function handleForgot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    try {
      await resetPassword({ username: email });
      setPendingEmail(email);
      setMode("reset");
      setNotice(t.codeSentNote);
    } catch (e) {
      setError(mapAuthError(e, t));
    }
  }

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const confirm = String(form.get("confirmPassword"));
    if (password !== confirm) {
      setError(t.passwordMismatch);
      return;
    }
    try {
      await confirmResetPassword({
        username: pendingEmail,
        confirmationCode: String(form.get("code")),
        newPassword: password,
      });
      setMode("signin");
      setNotice(t.resetDoneNote);
    } catch (e) {
      setError(mapAuthError(e, t));
    }
  }

  const tabs =
    mode === "signin" || mode === "signup" ? (
      <div className="flex gap-6 border-b border-hairline">
        {(["signin", "signup"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setMode(tab);
              setError(null);
              setNotice(null);
            }}
            className={`pb-2 text-sm font-semibold uppercase tracking-wide transition ${
              mode === tab
                ? "border-b-2 border-primary text-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {tab === "signin" ? t.signIn : t.signUp}
          </button>
        ))}
      </div>
    ) : null;

  const body = (
    <>
      {!embedded && mode === "signin" && (
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-primary">LeveCare</h2>
          <p className="mt-3 font-display text-2xl font-semibold text-on-background">{t.welcomeBack}</p>
          <p className="mt-1 text-caption text-on-surface-variant">{t.subtitle}</p>
        </div>
      )}
      {!embedded && mode === "signup" && (
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-primary">LeveCare</h2>
          <p className="mt-3 font-display text-2xl font-semibold text-on-background">{t.createTitle}</p>
          <p className="mt-1 text-caption text-on-surface-variant">{t.createSubtitle}</p>
        </div>
      )}
      {!embedded && mode === "confirming" && (
        <div className="text-center">
          <Icon name="mark_email_read" className="text-[32px] text-primary" />
          <p className="mt-3 font-display text-2xl font-semibold text-on-background">{t.verifyTitle}</p>
          <p className="mt-1 text-caption text-on-surface-variant">
            {t.verifySubtitle} <strong>{pendingEmail}</strong>
          </p>
        </div>
      )}
      {!embedded && mode === "forgot" && (
        <div className="text-center">
          <Icon name="lock_reset" className="text-[32px] text-primary" />
          <p className="mt-3 font-display text-2xl font-semibold text-on-background">{t.forgotTitle}</p>
          <p className="mt-1 text-caption text-on-surface-variant">{t.forgotSubtitle}</p>
        </div>
      )}
      {!embedded && mode === "reset" && (
        <div className="text-center">
          <p className="font-display text-2xl font-semibold text-on-background">{t.resetTitle}</p>
          <p className="mt-1 text-caption text-on-surface-variant">{t.resetSubtitle}</p>
        </div>
      )}

      {embedded && (
        <div className="flex items-start gap-2 text-sm text-on-surface-variant">
          <Icon name="lock" className="mt-0.5 text-primary" />
          <p className="font-medium text-on-background">{dict.booking.authInline}</p>
        </div>
      )}

      {tabs}
      {notice && <p className="text-center text-sm text-primary">{notice}</p>}

      {mode === "confirming" && (
        <form onSubmit={handleConfirm} className="space-y-4">
          <Field label={t.confirmCode}>
            <Input name="code" required autoComplete="one-time-code" inputMode="numeric" />
          </Field>
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full">
            {t.confirm}
          </Button>
        </form>
      )}

      {mode === "forgot" && (
        <form onSubmit={handleForgot} className="space-y-4">
          <Field label={t.email}>
            <Input name="email" type="email" required defaultValue={pendingEmail} autoComplete="email" />
          </Field>
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full">
            {t.sendCode}
          </Button>
          <button
            type="button"
            onClick={() => setMode("signin")}
            className="block w-full text-center text-sm text-on-surface-variant underline hover:text-primary"
          >
            {t.backToSignIn}
          </button>
        </form>
      )}

      {mode === "reset" && (
        <form onSubmit={handleReset} className="space-y-4">
          <Field label={t.confirmCode}>
            <Input name="code" required autoComplete="one-time-code" />
          </Field>
          <Field label={t.newPassword}>
            <Input name="password" type="password" required minLength={10} autoComplete="new-password" />
          </Field>
          <Field label={t.confirmPassword}>
            <Input name="confirmPassword" type="password" required minLength={10} autoComplete="new-password" />
          </Field>
          <p className="text-xs text-outline">{t.passwordHint}</p>
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full">
            {t.resetPassword}
          </Button>
        </form>
      )}

      {mode === "signin" && (
        <form onSubmit={handleSignIn} className="space-y-4">
          <Field label={t.email}>
            <Input name="email" type="email" required defaultValue={defaultEmail} autoComplete="email" />
          </Field>
          <Field label={t.password}>
            <Input name="password" type="password" required minLength={10} autoComplete="current-password" />
          </Field>
          <button
            type="button"
            onClick={() => setMode("forgot")}
            className="text-sm text-on-surface-variant underline hover:text-primary"
          >
            {t.forgot}
          </button>
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full">
            {embedded ? t.access : t.signIn}
            <span aria-hidden>→</span>
          </Button>
          {!embedded && (
            <>
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-1 text-xs text-on-surface-variant">
                  <Icon name="verified_user" className="text-[16px]" />
                  {t.authNote}
                </span>
              </div>
              <p className="text-center text-caption text-outline">
                {t.noAccount}{" "}
                <button type="button" className="font-semibold text-primary underline" onClick={() => setMode("signup")}>
                  {t.signUp}
                </button>
              </p>
            </>
          )}
        </form>
      )}

      {mode === "signup" && (
        <form onSubmit={handleSignUp} className="space-y-4">
          <Field label={t.fullName}>
            <Input name="name" required autoComplete="name" />
          </Field>
          <Field label={t.email}>
            <Input name="email" type="email" required defaultValue={defaultEmail} autoComplete="email" />
          </Field>
          <Field label={t.password}>
            <Input
              name="password"
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              placeholder={t.passwordHint}
            />
          </Field>
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full">
            {t.signUp}
          </Button>
          {!embedded && (
            <p className="text-center text-caption text-outline">
              {t.hasAccount}{" "}
              <button type="button" className="font-semibold text-primary underline" onClick={() => setMode("signin")}>
                {t.doSignIn}
              </button>
            </p>
          )}
        </form>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="space-y-4 rounded-[16px] border border-hairline bg-surface-container-low/80 p-5 md:p-6">
        {body}
      </div>
    );
  }

  return <SurfaceCard className="mx-auto w-full max-w-md space-y-5">{body}</SurfaceCard>;
}
