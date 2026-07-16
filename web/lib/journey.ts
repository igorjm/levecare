"use client";

/**
 * Journey continuity: keeps intake context in sessionStorage so the patient
 * never re-types data between Avaliação → Agenda → Painel.
 */
export interface JourneyState {
  intakeId?: string;
  email?: string;
  name?: string;
  bmi?: number;
  eligible?: boolean;
}

const KEY = "levecare.journey";

export function loadJourney(): JourneyState {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(KEY) ?? "{}") as JourneyState;
  } catch {
    return {};
  }
}

export function saveJourney(patch: JourneyState) {
  if (typeof window === "undefined") return;
  const next = { ...loadJourney(), ...patch };
  window.sessionStorage.setItem(KEY, JSON.stringify(next));
}
