package care.leve.patients.model;

import java.time.Instant;

public record Patient(
        String id,
        String name,
        String email,
        Instant createdAt
) {
}
