"use client";

import { Amplify } from "aws-amplify";
import {
  fetchAuthSession,
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
} from "aws-amplify/auth";

const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID ?? "us-east-1_placeholder";
const userPoolClientId = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID ?? "placeholder";

let configured = false;

export function configureAuth() {
  if (configured) return;
  Amplify.configure({
    Auth: {
      Cognito: { userPoolId, userPoolClientId },
    },
  });
  configured = true;
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

export { signIn, signOut, signUp, confirmSignUp, resetPassword, confirmResetPassword };
