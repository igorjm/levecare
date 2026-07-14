package care.leve.patients.repository;

import care.leve.patients.model.ConsentRecord;
import care.leve.patients.model.Patient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Single-table layout (ADR-004):
 *   PATIENT#{id} / PROFILE                — patient profile
 *   PATIENT#{id} / CONSENT#{ts}#{purpose} — immutable consent audit trail
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
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("pk", s("PATIENT#" + patient.id()));
        item.put("sk", s("PROFILE"));
        item.put("id", s(patient.id()));
        item.put("name", s(patient.name()));
        item.put("email", s(patient.email()));
        item.put("createdAt", s(patient.createdAt().toString()));
        dynamoDb.putItem(PutItemRequest.builder().tableName(tableName).item(item).build());
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
