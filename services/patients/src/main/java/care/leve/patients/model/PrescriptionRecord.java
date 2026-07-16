package care.leve.patients.model;

import java.time.Instant;

/**
 * Metadata of an issued demo prescription. Only metadata is persisted; the
 * watermarked PDF is regenerated deterministically from it on re-download.
 */
public record PrescriptionRecord(
        String id,
        String patientId,
        Instant issuedAt
) {
}
