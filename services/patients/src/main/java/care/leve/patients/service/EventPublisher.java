package care.leve.patients.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.eventbridge.EventBridgeClient;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequest;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequestEntry;

import java.util.Map;

@Service
public class EventPublisher {

    private static final Logger log = LoggerFactory.getLogger(EventPublisher.class);

    private final EventBridgeClient eventBridge;
    private final ObjectMapper objectMapper;
    private final String busName;

    public EventPublisher(EventBridgeClient eventBridge,
                          ObjectMapper objectMapper,
                          @Value("${app.event-bus-name}") String busName) {
        this.eventBridge = eventBridge;
        this.objectMapper = objectMapper;
        this.busName = busName;
    }

    /** Best-effort domain event publication; failures are logged, never propagated. */
    public void publish(String detailType, Map<String, Object> detail) {
        try {
            eventBridge.putEvents(PutEventsRequest.builder()
                    .entries(PutEventsRequestEntry.builder()
                            .eventBusName(busName)
                            .source("levecare.patients")
                            .detailType(detailType)
                            .detail(objectMapper.writeValueAsString(detail))
                            .build())
                    .build());
        } catch (JsonProcessingException | software.amazon.awssdk.core.exception.SdkException e) {
            log.error("failed to publish event {}", detailType, e);
        }
    }
}
