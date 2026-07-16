package care.leve.patients.repository;

import care.leve.patients.model.ConsentRecord;
import care.leve.patients.model.Patient;
import care.leve.patients.model.PrescriptionRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;

import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Single-table layout (ADR-004):
 *   PATIENT#{id} / PROFILE                — patient profile
 *   PATIENT#{id} / CONSENT#{ts}#{purpose} — immutable consent audit trail
 *   PATIENT#{id} / RX#{ts}#{rxId}         — demo prescription metadata
 *   EMAIL#{email} / PATIENT#{id}          — lookup copy so a signed-in user can
 *                                           recover their patient record
 */
@Repository
public class PatientRepository {

    private final DynamoDbClient dynamoDb;
    private final String tableName;

    public PatientRepository(DynamoDbClient dynamoDb, @Value("${app.table-name}") String tableName) {
        this.dynamoDb = dynamoDb;
        this.tableName = tableName;
    }

    public void save(Patient patient) {
        dynamoDb.putItem(PutItemRequest.builder().tableName(tableName)
                .item(patientItem(patient, "PATIENT#" + patient.id(), "PROFILE")).build());
        // Lookup copy keyed by email so the frontend can recover "my patient"
        // after a refresh (demo-safe: routes are JWT-protected).
        dynamoDb.putItem(PutItemRequest.builder().tableName(tableName)
                .item(patientItem(patient, emailPk(patient.email()), "PATIENT#" + patient.id())).build());
    }

    private Map<String, AttributeValue> patientItem(Patient patient, String pk, String sk) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("pk", s(pk));
        item.put("sk", s(sk));
        item.put("id", s(patient.id()));
        item.put("name", s(patient.name()));
        item.put("email", s(patient.email()));
        item.put("createdAt", s(patient.createdAt().toString()));
        return item;
    }

    private static String emailPk(String email) {
        return "EMAIL#" + email.toLowerCase();
    }

    public Optional<Patient> findById(String id) {
        var response = dynamoDb.getItem(GetItemRequest.builder()
                .tableName(tableName)
                .key(Map.of("pk", s("PATIENT#" + id), "sk", s("PROFILE")))
                .build());
        if (!response.hasItem() || response.item().isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(toPatient(response.item()));
    }

    /** Most recently created patient record for this email, if any. */
    public Optional<Patient> findByEmail(String email) {
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }
        var response = dynamoDb.query(QueryRequest.builder()
                .tableName(tableName)
                .keyConditionExpression("pk = :pk AND begins_with(sk, :prefix)")
                .expressionAttributeValues(Map.of(
                        ":pk", s(emailPk(email.trim())),
                        ":prefix", s("PATIENT#")))
                .build());
        return response.items().stream()
                .filter(item -> item.containsKey("id") && item.containsKey("createdAt"))
                .map(this::toPatient)
                .max(Comparator.comparing(Patient::createdAt));
    }

    public void savePrescription(PrescriptionRecord prescription) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("pk", s("PATIENT#" + prescription.patientId()));
        item.put("sk", s("RX#" + prescription.issuedAt() + "#" + prescription.id()));
        item.put("id", s(prescription.id()));
        item.put("patientId", s(prescription.patientId()));
        item.put("issuedAt", s(prescription.issuedAt().toString()));
        dynamoDb.putItem(PutItemRequest.builder().tableName(tableName).item(item).build());
    }

    public List<PrescriptionRecord> findPrescriptions(String patientId) {
        var response = dynamoDb.query(QueryRequest.builder()
                .tableName(tableName)
                .keyConditionExpression("pk = :pk AND begins_with(sk, :prefix)")
                .expressionAttributeValues(Map.of(
                        ":pk", s("PATIENT#" + patientId),
                        ":prefix", s("RX#")))
                .scanIndexForward(false)
                .build());
        return response.items().stream()
                .map(item -> new PrescriptionRecord(
                        item.get("id").s(),
                        patientId,
                        Instant.parse(item.get("issuedAt").s())))
                .toList();
    }

    public Optional<PrescriptionRecord> findPrescription(String patientId, String prescriptionId) {
        return findPrescriptions(patientId).stream()
                .filter(rx -> rx.id().equals(prescriptionId))
                .findFirst();
    }

    public void saveConsent(ConsentRecord consent) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("pk", s("PATIENT#" + consent.patientId()));
        item.put("sk", s("CONSENT#" + consent.recordedAt() + "#" + consent.purpose()));
        item.put("purpose", s(consent.purpose()));
        item.put("granted", AttributeValue.builder().bool(consent.granted()).build());
        item.put("legalBasis", s(consent.legalBasis()));
        item.put("recordedAt", s(consent.recordedAt().toString()));
        dynamoDb.putItem(PutItemRequest.builder().tableName(tableName).item(item).build());
    }

    public List<ConsentRecord> findConsents(String patientId) {
        var response = dynamoDb.query(QueryRequest.builder()
                .tableName(tableName)
                .keyConditionExpression("pk = :pk AND begins_with(sk, :prefix)")
                .expressionAttributeValues(Map.of(
                        ":pk", s("PATIENT#" + patientId),
                        ":prefix", s("CONSENT#")))
                .build());
        return response.items().stream()
                .map(item -> new ConsentRecord(
                        patientId,
                        item.get("purpose").s(),
                        item.get("granted").bool(),
                        item.get("legalBasis").s(),
                        Instant.parse(item.get("recordedAt").s())))
                .toList();
    }

    private Patient toPatient(Map<String, AttributeValue> item) {
        return new Patient(
                item.get("id").s(),
                item.get("name").s(),
                item.get("email").s(),
                Instant.parse(item.get("createdAt").s()));
    }

    private static AttributeValue s(String value) {
        return AttributeValue.builder().s(value).build();
    }
}
