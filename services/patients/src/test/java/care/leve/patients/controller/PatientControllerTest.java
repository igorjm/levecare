package care.leve.patients.controller;

import care.leve.patients.model.Patient;
import care.leve.patients.repository.PatientRepository;
import care.leve.patients.service.EventPublisher;
import care.leve.patients.service.PrescriptionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PatientController.class)
class PatientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PatientRepository repository;

    @MockitoBean
    private PrescriptionService prescriptionService;

    @MockitoBean
    private EventPublisher events;

    @Test
    void createsPatient() throws Exception {
        mockMvc.perform(post("/patients")
                        .contentType("application/json")
                        .content("{\"name\":\"Maria Silva\",\"email\":\"maria@example.com\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Maria Silva"))
                .andExpect(jsonPath("$.id").isNotEmpty());

        verify(repository).save(any(Patient.class));
    }

    @Test
    void rejectsInvalidPatient() throws Exception {
        mockMvc.perform(post("/patients")
                        .contentType("application/json")
                        .content("{\"name\":\"\",\"email\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void returns404ForUnknownPatient() throws Exception {
        when(repository.findById("missing")).thenReturn(Optional.empty());

        mockMvc.perform(get("/patients/missing"))
                .andExpect(status().isNotFound());
    }

    @Test
    void recordsConsent() throws Exception {
        when(repository.findById("p-1")).thenReturn(Optional.of(
                new Patient("p-1", "Maria", "maria@example.com", Instant.now())));

        mockMvc.perform(post("/patients/p-1/consent")
                        .contentType("application/json")
                        .content("{\"purpose\":\"tratamento-clinico\",\"granted\":true}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.purpose").value("tratamento-clinico"))
                .andExpect(jsonPath("$.granted").value(true))
                .andExpect(jsonPath("$.legalBasis").isNotEmpty());
    }
}
