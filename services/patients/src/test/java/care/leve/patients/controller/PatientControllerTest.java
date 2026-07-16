package care.leve.patients.controller;

import care.leve.patients.model.Patient;
import care.leve.patients.model.PrescriptionRecord;
import care.leve.patients.repository.PatientRepository;
import care.leve.patients.service.EventPublisher;
import care.leve.patients.service.PrescriptionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
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
    void findsPatientByEmail() throws Exception {
        when(repository.findByEmail("maria@example.com")).thenReturn(Optional.of(
                new Patient("p-1", "Maria", "maria@example.com", Instant.now())));

        mockMvc.perform(get("/patients/by-email").param("email", "maria@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("p-1"));
    }

    @Test
    void returns404WhenEmailHasNoPatient() throws Exception {
        when(repository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        mockMvc.perform(get("/patients/by-email").param("email", "nobody@example.com"))
                .andExpect(status().isNotFound());
    }

    @Test
    void issuesAndPersistsPrescription() throws Exception {
        Patient patient = new Patient("p-1", "Maria", "maria@example.com", Instant.now());
        when(repository.findById("p-1")).thenReturn(Optional.of(patient));
        when(prescriptionService.issue(patient)).thenReturn(
                new PrescriptionService.DemoPrescription("rx-1", "p-1", Instant.now(), new byte[]{1}));

        mockMvc.perform(post("/patients/p-1/prescriptions"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("rx-1"));

        verify(repository).savePrescription(any(PrescriptionRecord.class));
    }

    @Test
    void listsPrescriptions() throws Exception {
        when(repository.findById("p-1")).thenReturn(Optional.of(
                new Patient("p-1", "Maria", "maria@example.com", Instant.now())));
        when(repository.findPrescriptions("p-1")).thenReturn(List.of(
                new PrescriptionRecord("rx-1", "p-1", Instant.parse("2026-07-01T12:00:00Z"))));

        mockMvc.perform(get("/patients/p-1/prescriptions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("rx-1"));
    }

    @Test
    void reDownloadsPersistedPrescription() throws Exception {
        Patient patient = new Patient("p-1", "Maria", "maria@example.com", Instant.now());
        Instant issuedAt = Instant.parse("2026-07-01T12:00:00Z");
        when(repository.findById("p-1")).thenReturn(Optional.of(patient));
        when(repository.findPrescription("p-1", "rx-1")).thenReturn(Optional.of(
                new PrescriptionRecord("rx-1", "p-1", issuedAt)));
        when(prescriptionService.render(patient, "rx-1", issuedAt)).thenReturn(
                new PrescriptionService.DemoPrescription("rx-1", "p-1", issuedAt, new byte[]{1}));

        mockMvc.perform(get("/patients/p-1/prescriptions/rx-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("rx-1"))
                .andExpect(jsonPath("$.pdfBase64").isNotEmpty());
    }

    @Test
    void returns404ForUnknownPrescription() throws Exception {
        when(repository.findById("p-1")).thenReturn(Optional.of(
                new Patient("p-1", "Maria", "maria@example.com", Instant.now())));
        when(repository.findPrescription("p-1", "missing")).thenReturn(Optional.empty());

        mockMvc.perform(get("/patients/p-1/prescriptions/missing"))
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
