package com.trafficjam.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trafficjam.matsim.EventHandler;
import io.nats.client.Connection;
import io.nats.client.JetStream;
import io.nats.client.JetStreamManagement;
import io.nats.client.Nats;
import io.nats.client.Options;
import io.nats.client.api.RetentionPolicy;
import io.nats.client.api.StreamConfiguration;
import io.nats.client.api.StorageType;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@Component
public class NatsJetStreamClient {

    private static final Logger logger = LoggerFactory.getLogger(NatsJetStreamClient.class);
    private static final String STREAM_NAME = "SIMULATIONS";
    private static final Duration MAX_AGE = Duration.of(30, ChronoUnit.DAYS);
    private static final int MAX_RECONNECTS = -1;
    private static final Duration RECONNECT_WAIT = Duration.ofSeconds(2);

    @Value("${nats.url:nats://localhost:4222}")
    private String natsUrl;

    private Connection connection;
    private JetStream jetStream;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void connect() {
        try {
            Options options = buildOptions();
            connection = Nats.connectReconnectOnConnect(options);
            ensureStream();
            jetStream = connection.jetStream();
            logger.info("Connected to NATS JetStream at {}", natsUrl);
        } catch (Exception e) {
            logger.error("Failed to connect to NATS at {}: {}", natsUrl, e.getMessage());
        }
    }

    private Options buildOptions() {
        return new Options.Builder()
                .server(natsUrl)
                .maxReconnects(MAX_RECONNECTS)
                .reconnectWait(RECONNECT_WAIT)
                .connectionListener((conn, type) ->
                        logger.info("NATS connection event: {}", type))
                .errorListener(new io.nats.client.ErrorListener() {
                    @Override
                    public void errorOccurred(Connection conn, String error) {
                        logger.error("NATS error: {}", error);
                    }

                    @Override
                    public void exceptionOccurred(Connection conn, Exception exp) {
                        logger.error("NATS exception: {}", exp.getMessage());
                    }
                })
                .build();
    }

    private void ensureStream() throws Exception {
        JetStreamManagement jsm = connection.jetStreamManagement();
        StreamConfiguration config = StreamConfiguration.builder()
                .name(STREAM_NAME)
                .subjects("sim.>")
                .retentionPolicy(RetentionPolicy.Limits)
                .storageType(StorageType.File)
                .maxAge(MAX_AGE)
                .build();
        try {
            jsm.addStream(config);
        } catch (Exception e) {
            jsm.updateStream(config);
        }
    }

    public boolean isConnected() {
        return connection != null
                && connection.getStatus() == Connection.Status.CONNECTED
                && jetStream != null;
    }

    public void publishEvent(String scenarioId, String runId, EventHandler.TransformedEvent event) {
        if (!isConnected()) {
            logger.warn("JetStream not connected, dropping event");
            return;
        }
        try {
            byte[] payload = objectMapper.writeValueAsBytes(event);
            jetStream.publish(buildSubject(scenarioId, runId, "events"), payload);
        } catch (Exception e) {
            logger.error("Failed to publish event: {}", e.getMessage());
        }
    }

    public void publishStatus(String scenarioId, String runId, String status) {
        if (!isConnected()) {
            logger.warn("JetStream not connected, dropping status");
            return;
        }
        try {
            Map<String, String> statusMap = Map.of("status", status);
            byte[] payload = objectMapper.writeValueAsBytes(statusMap);
            jetStream.publish(buildSubject(scenarioId, runId, "status"), payload);
        } catch (Exception e) {
            logger.error("Failed to publish status: {}", e.getMessage());
        }
    }

    private String buildSubject(String scenarioId, String runId, String type) {
        return "sim." + scenarioId + "." + runId + "." + type;
    }

    @PreDestroy
    public void disconnect() {
        try {
            if (connection != null) {
                connection.close();
            }
        } catch (Exception e) {
            logger.error("Failed to close NATS connection: {}", e.getMessage());
        }
    }
}
