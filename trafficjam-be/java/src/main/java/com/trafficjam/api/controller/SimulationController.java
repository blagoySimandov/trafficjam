package com.trafficjam.api.controller;

import com.trafficjam.api.dto.SimulationResponse;
import com.trafficjam.api.dto.SimulationStatusResponse;
import com.trafficjam.matsim.MatsimRunner;
import com.trafficjam.service.SimulationService;
import org.springframework.http.HttpStatus;
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
public class SimulationController {

    private final SimulationService simulationService;

    public SimulationController(SimulationService simulationService) {
        this.simulationService = simulationService;
    }

    /**
     * Starts a new MatSim simulation with uploaded network file.
     * Plans file support will be added in future for full agent-based simulation.
     */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<SimulationResponse> startSimulation(
            @RequestParam("networkFile") MultipartFile networkFile,
            // @RequestParam("plansFile") MultipartFile plansFile, // TODO: Add for
            // agent-based simulation
            @RequestParam(value = "iterations", required = false, defaultValue = "10") Integer iterations,
            @RequestParam(value = "randomSeed", required = false, defaultValue = "4711") Long randomSeed) {

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
    @GetMapping("/{id}/status")
    public ResponseEntity<SimulationStatusResponse> getSimulationStatus(@PathVariable String id) {
        MatsimRunner.SimulationStatus status = simulationService.getSimulationStatus(id);

        if (status == null) {
            return ResponseEntity.notFound().build();
        }

        SimulationStatusResponse response = new SimulationStatusResponse(
                status.simulationId,
                status.status,
                status.error);

        return ResponseEntity.ok(response);
    }

    /**
     * Streams simulation events in real-time via Server-Sent Events.
     */
    @GetMapping("/{id}/events")
    public SseEmitter streamEvents(@PathVariable String id) {
        // TODO: Create SseEmitter with timeout
        // TODO: Call simulationService.streamEvents()
        // TODO: Return emitter
        throw new UnsupportedOperationException("Not implemented yet");
    }

    /**
     * Stops a running simulation.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void stopSimulation(@PathVariable String id) {
        simulationService.stopSimulation(id);
    }
}
