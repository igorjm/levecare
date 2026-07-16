"use client";

import { useState } from "react";
import {
  configureAuth,
  signIn,
  signUp,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
} from "@/lib/auth";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { Icon } from "@/components/ui/DemoBadge";

type AuthMode = "signin" | "confirming" | "forgot" | "reset";

export function AuthCard({
  dict,
  defaultEmail = "",
  subtitle,
  onSignedIn,
}: {
  dict: Dictionary;
  defaultEmail?: string;
  subtitle?: string;
  onSignedIn: () => void;
}) {
  const t = dict.auth;
  const [mode, setMode] = useState<AuthMode>("signin");
  const [pendingEmail, setPendingEmail] = useState(defaultEmail);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  configureAuth();

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const form = new FormData(event.currentTarget, submitter ?? undefined);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const action = String(form.get("mode") ?? submitter?.value ?? "signin");
    try {
      if (action === "signup") {
        await signUp({ username: email, password, options: { userAttributes: { email } } });
        setPendingEmail(email);
        setMode("confirming");
        setNotice(t.codeSentNote);
      } else {
        await signIn({ username: email, password });
        onSignedIn();
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
      setMode("signin");
      setNotice(t.confirmedNote);
    } catch (e) {
      setError(e instanceof Error ? e.message : "confirmation error");
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
      setError(e instanceof Error ? e.message : "reset error");
    }
  }

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await confirmResetPassword({
        username: pendingEmail,
        confirmationCode: String(form.get("code")),
        newPassword: String(form.get("password")),
      });
      setMode("signin");
      setNotice(t.resetDoneNote);
    } catch (e) {
      setError(e instanceof Error ? e.message : "reset error");
    }
  }

  return (
    <SurfaceCard className="mx-auto w-full max-w-md space-y-5">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold text-primary">LeveCare</h2>
        <p className="mt-1 text-caption text-on-surface-variant">{subtitle ?? t.subtitle}</p>
      </div>

      {notice && <p className="text-center text-sm text-primary">{notice}</p>}

      {mode === "confirming" && (
        <form onSubmit={handleConfirm} className="space-y-4">
          <Field label={t.confirmCode}>
            <Input name="code" required autoComplete="one-time-code" />
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
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full">
            {t.resetPassword}
          </Button>
        </form>
      )}

      {mode === "signin" && (
        <form onSubmit={handleAuth} className="space-y-4">
          <Field label={t.email}>
            <Input name="email" type="email" required defaultValue={defaultEmail} autoComplete="email" />
          </Field>
          <Field label={t.password}>
            <Input name="password" type="password" required minLength={10} autoComplete="current-password" />
          </Field>
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" name="mode" value="signin" className="flex-1">
              {t.signIn}
              <span aria-hidden>→</span>
            </Button>
            <Button type="submit" name="mode" value="signup" variant="secondary" className="flex-1">
              {t.signUp}
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setMode("forgot")}
            className="block w-full text-center text-sm text-on-surface-variant underline hover:text-primary"
          >
            {t.forgot}
          </button>
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-1 text-xs text-on-surface-variant">
              <Icon name="verified_user" className="text-[16px]" />
              {t.authNote}
            </span>
          </div>
          <p className="text-center text-caption text-outline">{t.newAccount}</p>
        </form>
      )}
    </SurfaceCard>
  );
}
