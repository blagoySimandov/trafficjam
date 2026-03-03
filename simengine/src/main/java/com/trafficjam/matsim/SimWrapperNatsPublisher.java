package com.trafficjam.matsim;

import com.trafficjam.service.NatsJetStreamClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

@Component
public class SimWrapperNatsPublisher {

    private static final Logger logger = LoggerFactory.getLogger(SimWrapperNatsPublisher.class);
    private final NatsJetStreamClient natsClient;

    public SimWrapperNatsPublisher(NatsJetStreamClient natsClient) {
        this.natsClient = natsClient;
    }

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
