package care.leve.patients.model;

import java.time.Instant;

/**
 * LGPD art. 8/11 consent record: explicit, purpose-specific, revocable and auditable.
 * Consent is never overwritten — each grant/revocation is a new immutable record.
 */
public record ConsentRecord(
        String patientId,
        String purpose,
        boolean granted,
        String legalBasis,
        Instant recordedAt
) {
    public static final String BASIS_CONSENT = "LGPD art. 7 I / art. 11 I — consentimento";
}
