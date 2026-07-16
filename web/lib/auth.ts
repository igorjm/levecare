"use client";

import { Amplify } from "aws-amplify";
import {
  fetchAuthSession,
  signIn as amplifySignIn,
  signOut,
  signUp,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
} from "aws-amplify/auth";
import type { Dictionary } from "@/lib/i18n";

// Demo Cognito pool (public in README). Env vars override when set (CI/deploy).
const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID || "us-east-1_H2UchxRAL";
const userPoolClientId =
  process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "qm2hcuehjmf1ekksbr66s5evp";

let configuredKey = "";

export function configureAuth() {
  const key = `${userPoolId}:${userPoolClientId}`;
  if (configuredKey === key) return;
  Amplify.configure({
    Auth: {
      Cognito: { userPoolId, userPoolClientId },
    },
  });
  configuredKey = key;
}

export async function getToken(): Promise<string | null> {
  configureAuth();
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}

/** Email of the signed-in user, from the Cognito ID token claims. */
export async function getUserEmail(): Promise<string | null> {
  configureAuth();
  try {
    const session = await fetchAuthSession();
    const email = session.tokens?.idToken?.payload?.email;
    return typeof email === "string" ? email : null;
  } catch {
    return null;
  }
}

/** Sign in; if Amplify already has a session, replace it. */
export async function signIn(input: { username: string; password: string }) {
  configureAuth();
  try {
    return await amplifySignIn(input);
  } catch (error) {
    const name = (error as { name?: string })?.name;
    if (name === "UserAlreadyAuthenticatedException") {
      await signOut();
      return amplifySignIn(input);
    }
    throw error;
  }
}

type AuthMessages = Dictionary["auth"];

/** Map Cognito/Amplify errors to locale strings — never surface raw English SDK text. */
export function mapAuthError(error: unknown, t: AuthMessages): string {
  const name = (error as { name?: string })?.name ?? "";
  const message = error instanceof Error ? error.message : String(error ?? "");
  const haystack = `${name} ${message}`.toLowerCase();

  if (
    haystack.includes("placeholder") ||
    haystack.includes("does not exist") ||
    name === "ResourceNotFoundException"
  ) {
    return t.errors.misconfigured;
  }
  if (name === "NotAuthorizedException" || haystack.includes("incorrect username or password")) {
    return t.errors.badCredentials;
  }
  if (name === "UserNotConfirmedException" || haystack.includes("user is not confirmed")) {
    return t.errors.notConfirmed;
  }
  if (name === "UsernameExistsException" || haystack.includes("already exists")) {
    return t.errors.userExists;
  }
  if (name === "UserNotFoundException") {
    return t.errors.userNotFound;
  }
  if (name === "CodeMismatchException" || haystack.includes("invalid verification code")) {
    return t.errors.badCode;
  }
  if (name === "ExpiredCodeException" || haystack.includes("expired")) {
    return t.errors.expiredCode;
  }
  if (name === "InvalidPasswordException" || haystack.includes("password")) {
    return t.errors.weakPassword;
  }
  if (name === "LimitExceededException" || haystack.includes("limit exceeded")) {
    return t.errors.rateLimited;
  }
  if (haystack.includes("network") || haystack.includes("failed to fetch")) {
    return t.errors.network;
  }
  return t.errors.generic;
}

export { signOut, signUp, confirmSignUp, resetPassword, confirmResetPassword };
