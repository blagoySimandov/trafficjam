package com.trafficjam.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trafficjam.matsim.EventHandler;
import io.nats.client.Connection;
import io.nats.client.JetStream;
import io.nats.client.JetStreamManagement;
import io.nats.client.Nats;
import io.nats.client.Options;
import io.nats.client.api.ObjectStoreConfiguration;
import io.nats.client.api.RetentionPolicy;
import io.nats.client.api.StreamConfiguration;
import io.nats.client.api.StorageType;
import io.nats.client.ObjectStore;
import io.nats.client.ObjectStoreManagement;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;

/**
 * Client for connecting to NATS JetStream and publishing simulation events.
 * Manages the connection lifecycle, stream configuration, and Object Store
 * operations.
 */
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

    /**
     * Initializes the NATS connection, creating streams as needed.
     */
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
                .connectionListener((conn, type) -> logger.info("NATS connection event: {}", type))
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

    /**
     * Checks if the JetStream connection is currently active.
     *
     * @return true if connected, false otherwise
     */
    public boolean isConnected() {
        return connection != null
                && connection.getStatus() == Connection.Status.CONNECTED
                && jetStream != null;
    }

    /**
     * Publishes a transformed simulation event to JetStream.
     *
     * @param scenarioId the scenario ID
     * @param runId      the run ID
     * @param event      the event payload
     */
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

    /**
     * Publishes a simulation status update to JetStream.
     *
     * @param scenarioId the scenario ID
     * @param runId      the run ID
     * @param status     the status string
     */
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

    /**
     * Publishes a notification that SimWrapper data is fully uploaded to the Object
     * Store.
     *
     * @param runId      the run ID
     * @param bucketName the NATS Object Store bucket name
     */
    public void publishSimWrapperReady(String runId, String bucketName) {
        if (!isConnected()) {
            logger.warn("JetStream not connected, dropping simwrapper ready event");
            return;
        }
        try {
            Map<String, String> payloadMap = Map.of("run_id", runId, "bucket_name", bucketName);
            byte[] payload = objectMapper.writeValueAsBytes(payloadMap);
            jetStream.publish("sim." + runId + ".simwrapper.ready", payload);
        } catch (Exception e) {
            logger.error("Failed to publish SimWrapper ready event: {}", e.getMessage());
        }
    }

    /**
     * Uploads a file to a NATS Object Store bucket. Creates the bucket if it does
     * not exist.
     *
     * @param bucketName the destination bucket
     * @param objectName the destination object key
     * @param file       the source file to upload
     */
    public void uploadToObjectStore(String bucketName, String objectName, File file) {
        if (connection == null || connection.getStatus() != Connection.Status.CONNECTED) {
            logger.warn("NATS not connected, cannot upload to object store");
            return;
        }
        try {
            ObjectStoreManagement osm = connection.objectStoreManagement();
            try {
                osm.getStatus(bucketName);
            } catch (Exception e) {
                // Bucket doesn't exist, create it
                ObjectStoreConfiguration osc = ObjectStoreConfiguration.builder(bucketName)
                        .storageType(StorageType.File)
                        .build();
                osm.create(osc);
            }

            ObjectStore os = connection.objectStore(bucketName);
            try (InputStream in = new FileInputStream(file)) {
                os.put(objectName, in);
            }
            logger.debug("Successfully uploaded {} to bucket {}", objectName, bucketName);
        } catch (Exception e) {
            logger.error("Failed to upload {} to bucket {}: {}", objectName, bucketName, e.getMessage());
        }
    }

    /**
     * Closes the NATS connection.
     */
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
