const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface IntakePayload {
  email: string;
  age: number;
  heightCm: number;
  weightKg: number;
  comorbidities: string[];
  pregnant: boolean;
  eatingDisorderHistory: boolean;
}

export interface IntakeResult {
  id: string;
  bmi: number;
  eligible: boolean;
  reasons: string[];
}

export interface Slot {
  id: string;
  provider: string;
  crm: string;
  startsAt: string;
}

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  submitIntake: (payload: IntakePayload) =>
    request<IntakeResult>("/intake", { method: "POST", body: JSON.stringify(payload) }),

  listSlots: () => request<{ slots: Slot[] }>("/slots"),

  book: (payload: { slotId: string; email: string; name: string }, token: string) =>
    request<{ id: string }>("/bookings", { method: "POST", body: JSON.stringify(payload) }, token),

  createPatient: (payload: { name: string; email: string }, token: string) =>
    request<{ id: string; name: string; email: string }>(
      "/patients",
      { method: "POST", body: JSON.stringify(payload) },
      token,
    ),

  recordConsent: (patientId: string, payload: { purpose: string; granted: boolean }, token: string) =>
    request(`/patients/${patientId}/consent`, { method: "POST", body: JSON.stringify(payload) }, token),

  issuePrescription: (patientId: string, token: string) =>
    request<{ id: string; pdfBase64: string; disclaimer: string }>(
      `/patients/${patientId}/prescriptions`,
      { method: "POST" },
      token,
    ),
};
