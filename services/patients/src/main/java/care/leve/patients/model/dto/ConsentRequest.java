package care.leve.patients.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ConsentRequest(
        @NotBlank String purpose,
        @NotNull Boolean granted
) {
}
