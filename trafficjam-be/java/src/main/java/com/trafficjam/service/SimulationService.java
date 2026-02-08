package com.trafficjam.service;

import com.trafficjam.matsim.ConfigGenerator;
import com.trafficjam.matsim.MatsimRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Service layer for managing MatSim simulations.
 * Handles file uploads, config generation, and simulation lifecycle.
 */
@Service
public class SimulationService {

    private final MatsimRunner matsimRunner;

    @Value("${matsim.temp.directory}")
    private String tempDirectory;

    @Value("${matsim.output.directory}")
    private String outputDirectory;

    public SimulationService() {
        this.matsimRunner = new MatsimRunner();
    }

    /**
     * Starts a new simulation with uploaded network file.
     * Plans file support is commented out for MVP - will be added later.
     */
    public String startSimulation(MultipartFile networkFile,
            // MultipartFile plansFile, // TODO: Add plans file support for full simulation
            Integer iterations, Long randomSeed) throws IOException {
        // Create unique simulation directory
        String simulationId = UUID.randomUUID().toString();
        Path simDir = Paths.get(tempDirectory, simulationId);
        Files.createDirectories(simDir);

        // Save uploaded network file
        Path networkPath = simDir.resolve("network.xml");
        networkFile.transferTo(networkPath.toFile());

        // TODO: Plans file handling for future implementation
        // Path plansPath = simDir.resolve("plans.xml");
        // plansFile.transferTo(plansPath.toFile());

        // Use default empty plans file for MVP (no agents)
        String defaultPlansPath = getClass().getClassLoader()
                .getResource("default-plans.xml").getPath();

        // Generate config.xml
        Path outputPath = Paths.get(outputDirectory, simulationId);
        Files.createDirectories(outputPath);

        Path configPath = simDir.resolve("config.xml");
        ConfigGenerator generator = new ConfigGenerator();
        String configContent = generator.generateConfig(
                networkPath.toString(),
                defaultPlansPath, // Use default empty plans for MVP
                "EPSG:4326", // Projected coordinate system
                outputPath.toString(),
                iterations,
                randomSeed.intValue());

        // Write config to file
        Files.writeString(configPath, configContent); // Start simulation asynchronously
        String actualSimId = matsimRunner.runSimulationAsync(
                configPath.toString(),
                event -> {
                    // Event callback - will be used for SSE streaming
                });

        return actualSimId;
    }

    /**
     * Gets the current status of a running simulation.
     */
    public MatsimRunner.SimulationStatus getSimulationStatus(String simulationId) {
        return matsimRunner.getSimulationStatus(simulationId);
    }

    /**
     * Stops a running simulation gracefully.
     */
    public void stopSimulation(String simulationId) {
        matsimRunner.stopSimulation(simulationId);
    }

    /**
     * Streams simulation events in real-time via Server-Sent Events.
     */
    public void streamEvents(String simulationId, SseEmitter emitter) {
        // TODO: Register event callback that sends events to SSE emitter
        // TODO: Handle emitter completion and errors
        throw new UnsupportedOperationException("Not implemented yet");
    }
}
