package care.leve.patients.controller;

import care.leve.patients.model.ConsentRecord;
import care.leve.patients.model.Patient;
import care.leve.patients.model.PrescriptionRecord;
import care.leve.patients.model.dto.ConsentRequest;
import care.leve.patients.model.dto.CreatePatientRequest;
import care.leve.patients.repository.PatientRepository;
import care.leve.patients.service.EventPublisher;
import care.leve.patients.service.PrescriptionService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/patients")
public class PatientController {

    private static final Logger log = LoggerFactory.getLogger(PatientController.class);

    private final PatientRepository repository;
    private final PrescriptionService prescriptionService;
    private final EventPublisher events;

    public PatientController(PatientRepository repository,
                             PrescriptionService prescriptionService,
                             EventPublisher events) {
        this.repository = repository;
        this.prescriptionService = prescriptionService;
        this.events = events;
    }

    @PostMapping
    public ResponseEntity<Patient> create(@Valid @RequestBody CreatePatientRequest request) {
        Patient patient = new Patient(UUID.randomUUID().toString(), request.name(), request.email(), Instant.now());
        repository.save(patient);
        log.info("patient created id={}", patient.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(patient);
    }

    @GetMapping("/{id}")
    public Patient get(@PathVariable String id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "patient not found"));
    }

    /**
     * Recovers the caller's patient record after a page refresh (JWT-protected).
     * Dedicated path (not GET /patients?email=) so API Gateway + the Lambda
     * adapter never confuse this with GET /patients/{id}. Empty → 404 body-less
     * ResponseEntity (more reliable than ResponseStatusException in this runtime).
     */
    @GetMapping("/by-email")
    public ResponseEntity<Patient> findByEmail(@RequestParam String email) {
        return repository.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/consent")
    public ResponseEntity<ConsentRecord> recordConsent(@PathVariable String id,
                                                       @Valid @RequestBody ConsentRequest request) {
        Patient patient = get(id);
        ConsentRecord consent = new ConsentRecord(
                patient.id(), request.purpose(), request.granted(),
                ConsentRecord.BASIS_CONSENT, Instant.now());
        repository.saveConsent(consent);
        log.info("consent recorded patient={} purpose={} granted={}", id, request.purpose(), request.granted());
        return ResponseEntity.status(HttpStatus.CREATED).body(consent);
    }

    @GetMapping("/{id}/consent")
    public List<ConsentRecord> listConsents(@PathVariable String id) {
        get(id);
        return repository.findConsents(id);
    }

    @PostMapping("/{id}/prescriptions")
    public ResponseEntity<Map<String, Object>> issuePrescription(@PathVariable String id) {
        Patient patient = get(id);
        var prescription = prescriptionService.issue(patient);
        repository.savePrescription(new PrescriptionRecord(
                prescription.id(), patient.id(), prescription.issuedAt()));
        events.publish("prescription.issued", Map.of(
                "prescriptionId", prescription.id(),
                "patientId", patient.id(),
                "email", patient.email()));
        log.info("demo prescription issued patient={} prescription={}", id, prescription.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(prescriptionBody(prescription));
    }

    @GetMapping("/{id}/prescriptions")
    public List<PrescriptionRecord> listPrescriptions(@PathVariable String id) {
        get(id);
        return repository.findPrescriptions(id);
    }

    /** Re-download: the demo PDF is regenerated deterministically from stored metadata. */
    @GetMapping("/{id}/prescriptions/{rxId}")
    public Map<String, Object> getPrescription(@PathVariable String id, @PathVariable String rxId) {
        Patient patient = get(id);
        PrescriptionRecord record = repository.findPrescription(id, rxId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "prescription not found"));
        var prescription = prescriptionService.render(patient, record.id(), record.issuedAt());
        return prescriptionBody(prescription);
    }

    private Map<String, Object> prescriptionBody(PrescriptionService.DemoPrescription prescription) {
        return Map.of(
                "id", prescription.id(),
                "patientId", prescription.patientId(),
                "issuedAt", prescription.issuedAt().toString(),
                "disclaimer", "DEMONSTRACAO — sem validade medica",
                "pdfBase64", Base64.getEncoder().encodeToString(prescription.pdf()));
    }
}
