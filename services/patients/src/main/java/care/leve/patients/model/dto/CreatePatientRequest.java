package care.leve.patients.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreatePatientRequest(
        @NotBlank String name,
        @NotBlank @Email String email
) {
}
