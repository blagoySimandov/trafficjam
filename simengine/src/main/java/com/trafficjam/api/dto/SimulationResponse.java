package com.trafficjam.api.dto;

/**
 * Response DTO after starting a simulation.
 * Contains the unique simulation ID and initial status.
 */
public class SimulationResponse {

    private String simulationId;
    private String status;

    // Constructors
    public SimulationResponse() {
    }

    public SimulationResponse(String simulationId, String status) {
        this.simulationId = simulationId;
        this.status = status;
    }

    // Getters and Setters
    public String getSimulationId() {
        return simulationId;
    }

    public void setSimulationId(String simulationId) {
        this.simulationId = simulationId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
