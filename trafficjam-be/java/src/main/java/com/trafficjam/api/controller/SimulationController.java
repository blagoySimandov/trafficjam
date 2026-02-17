package com.trafficjam.api.controller;

import com.trafficjam.api.dto.SimulationResponse;
import com.trafficjam.api.dto.SimulationStatusResponse;
import com.trafficjam.matsim.MatsimRunner;
import com.trafficjam.service.SimulationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

/**
 * REST controller for MatSim simulation endpoints.
 * Provides API for starting, monitoring, and stopping simulations.
 */
@RestController
@RequestMapping("/api/simulations")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173" })
@Tag(name = "Simulations", description = "Endpoints for managing traffic simulations")
public class SimulationController {

    private final SimulationService simulationService;

    public SimulationController(SimulationService simulationService) {
        this.simulationService = simulationService;
    }

    /**
     * Starts a new MatSim simulation with uploaded network file.
     * Plans file support will be added in future for full agent-based simulation.
     */
    @Operation(summary = "Start a new simulation", description = "Uploads a network file and starts a new MatSim simulation.")
    @ApiResponse(responseCode = "200", description = "Simulation started successfully", content = @Content(schema = @Schema(implementation = SimulationResponse.class)))
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SimulationResponse> startSimulation(
            @Parameter(description = "The MatSim network.xml file", required = true) @RequestParam("networkFile") MultipartFile networkFile,
            // @RequestParam("plansFile") MultipartFile plansFile, // TODO: Add for
            // agent-based simulation
            @Parameter(description = "Number of simulation iterations") @RequestParam(value = "iterations", required = false, defaultValue = "1") Integer iterations,
            @Parameter(description = "Random seed for the simulation") @RequestParam(value = "randomSeed", required = false) Long randomSeed) {

        // Use a random seed if not provided
        if (randomSeed == null) {
            randomSeed = (long) java.util.concurrent.ThreadLocalRandom.current().nextInt(1, 1000000);
        }

        try {
            String simulationId = simulationService.startSimulation(
                    networkFile, iterations, randomSeed);

            SimulationResponse response = new SimulationResponse(simulationId, "RUNNING");
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            throw new RuntimeException("Failed to process uploaded files", e);
        }
    }

    /**
     * Gets the current status of a simulation.
     */
    @Operation(summary = "Get simulation status", description = "Retrieves the current status of a simulation by its ID.")
    @ApiResponse(responseCode = "200", description = "Status retrieved successfully")
    @ApiResponse(responseCode = "404", description = "Simulation not found")
    @GetMapping("/{id}/status")
    public ResponseEntity<SimulationStatusResponse> getSimulationStatus(
            @Parameter(description = "Unique simulation ID") @PathVariable String id) {
        MatsimRunner.SimulationStatus status = simulationService.getSimulationStatus(id);

        if (status == null) {
            return ResponseEntity.notFound().build();
        }

        SimulationStatusResponse response = new SimulationStatusResponse(
                status.simulationId,
                status.status,
                status.error,
                status.iteration);

        return ResponseEntity.ok(response);
    }

    /**
     * Streams simulation events in real-time via Server-Sent Events.
     */
    @Operation(summary = "Stream simulation events", description = "Connects to a real-time stream of simulation events using Server-Sent Events (SSE).")
    @GetMapping(value = "/{id}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamEvents(
            @Parameter(description = "Unique simulation ID") @PathVariable String id) {
        // Create SSE emitter with 30 minute timeout
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);

        // Start streaming (service handles the actual streaming logic)
        simulationService.streamEvents(id, emitter);

        return emitter;
    }

    /**
     * Stops a running simulation.
     */
    @Operation(summary = "Stop a simulation", description = "Terminates a running simulation process.")
    @ApiResponse(responseCode = "204", description = "Simulation stopped")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void stopSimulation(
            @Parameter(description = "Unique simulation ID") @PathVariable String id) {
        simulationService.stopSimulation(id);
    }
}
