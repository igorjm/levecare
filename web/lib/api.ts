// Demo API (public in README). Env vars override when set (CI/deploy).
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://31yjtptfg8.execute-api.us-east-1.amazonaws.com";

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

export interface Booking {
  id: string;
  slotId: string;
  email: string;
  name: string;
  provider: string;
  crm?: string;
  startsAt: string;
  status: "confirmed" | "cancelled";
  intakeId?: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface ConsentEntry {
  patientId: string;
  purpose: string;
  granted: boolean;
  legalBasis: string;
  recordedAt: string;
}

export interface PrescriptionEntry {
  id: string;
  patientId: string;
  issuedAt: string;
}

export interface PrescriptionPdf {
  id: string;
  patientId: string;
  issuedAt: string;
  disclaimer: string;
  pdfBase64: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
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
    throw new ApiError(`API ${path} failed: ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

export const api = {
  submitIntake: (payload: IntakePayload) =>
    request<IntakeResult>("/intake", { method: "POST", body: JSON.stringify(payload) }),

  getIntake: (id: string) => request<IntakeResult>(`/intake/${id}`),

  listSlots: () => request<{ slots: Slot[] }>("/slots"),

  book: (
    payload: { slotId: string; email: string; name: string; intakeId?: string },
    token: string,
  ) =>
    request<Booking>("/bookings", { method: "POST", body: JSON.stringify(payload) }, token),

  listBookings: (token: string) => request<{ bookings: Booking[] }>("/bookings", {}, token),

  cancelBooking: (id: string, token: string) =>
    request<Booking>(`/bookings/${id}/cancel`, { method: "POST" }, token),

  createPatient: (payload: { name: string; email: string }, token: string) =>
    request<Patient>("/patients", { method: "POST", body: JSON.stringify(payload) }, token),

  findPatientByEmail: (email: string, token: string) =>
    request<Patient>(`/patients?email=${encodeURIComponent(email)}`, {}, token),

  recordConsent: (patientId: string, payload: { purpose: string; granted: boolean }, token: string) =>
    request(`/patients/${patientId}/consent`, { method: "POST", body: JSON.stringify(payload) }, token),

  listConsents: (patientId: string, token: string) =>
    request<ConsentEntry[]>(`/patients/${patientId}/consent`, {}, token),

  issuePrescription: (patientId: string, token: string) =>
    request<PrescriptionPdf>(`/patients/${patientId}/prescriptions`, { method: "POST" }, token),

  listPrescriptions: (patientId: string, token: string) =>
    request<PrescriptionEntry[]>(`/patients/${patientId}/prescriptions`, {}, token),

  getPrescription: (patientId: string, rxId: string, token: string) =>
    request<PrescriptionPdf>(`/patients/${patientId}/prescriptions/${rxId}`, {}, token),
};
