package com.trafficjam.api.dto;

/**
 * Response DTO for simulation status queries.
 * Contains simulation ID, current status, and error message if failed.
 */
public class SimulationStatusResponse {

    private String simulationId;
    private String status;
    private String error;

    // Constructors
    public SimulationStatusResponse() {
    }

    public SimulationStatusResponse(String simulationId, String status, String error) {
        this.simulationId = simulationId;
        this.status = status;
        this.error = error;
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

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
