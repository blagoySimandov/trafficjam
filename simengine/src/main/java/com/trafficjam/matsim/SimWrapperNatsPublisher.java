package com.trafficjam.matsim;

import com.trafficjam.service.NatsJetStreamClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

/**
 * Component responsible for uploading generated SimWrapper artifacts
 * (such as CSVs, YAML dashboards, and network files) to the NATS Object Store
 * after a MATSim simulation successfully completes.
 */
@Component
public class SimWrapperNatsPublisher {

    private static final Logger logger = LoggerFactory.getLogger(SimWrapperNatsPublisher.class);
    private final NatsJetStreamClient natsClient;

    /**
     * Constructs the publisher.
     *
     * @param natsClient the JetStream client used for publishing files
     */
    public SimWrapperNatsPublisher(NatsJetStreamClient natsClient) {
        this.natsClient = natsClient;
    }

    /**
     * Uploads the entire contents of a MATSim output directory to the NATS Object
     * Store
     * for a specific simulation run, and dispatches a readiness event.
     *
     * @param runId           the simulation run ID
     * @param outputDirectory the root MATSim output path
     */
    public void publishSimWrapperData(String runId, Path outputDirectory) {
        if (!natsClient.isConnected()) {
            logger.warn("NATS client is not connected. Cannot publish SimWrapper data.");
            return;
        }

        String bucketName = "sim-outputs-" + runId;
        logger.info("Publishing SimWrapper data from {} to bucket: {}", outputDirectory, bucketName);

        try (Stream<Path> paths = Files.walk(outputDirectory)) {
            paths.filter(Files::isRegularFile).forEach(path -> {
                try {
                    // Normalize object name to use forward slashes for NATS keys
                    String objectName = outputDirectory.relativize(path).toString().replace("\\", "/");
                    natsClient.uploadToObjectStore(bucketName, objectName, path.toFile());
                } catch (Exception e) {
                    logger.error("Error uploading file {}: {}", path, e.getMessage());
                }
            });

            // Notify that it's ready
            natsClient.publishSimWrapperReady(runId, bucketName);
            logger.info("Finished uploading SimWrapper data for run {}", runId);

        } catch (IOException e) {
            logger.error("Error walking output directory {}: {}", outputDirectory, e.getMessage());
        }
    }
}
