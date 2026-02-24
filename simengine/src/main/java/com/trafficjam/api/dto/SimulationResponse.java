package com.trafficjam.api.dto;

/**
 * Response DTO after starting a simulation.
 * Contains the unique simulation ID and initial status.
 */
public class SimulationResponse {

    private String simulationId;
    private String status;
    private String scenarioId;
    private String runId;

    // Constructors
    public SimulationResponse() {
    }

    public SimulationResponse(String simulationId, String status) {
        this.simulationId = simulationId;
        this.status = status;
    }

    public SimulationResponse(String simulationId, String status, String scenarioId, String runId) {
        this.simulationId = simulationId;
        this.status = status;
        this.scenarioId = scenarioId;
        this.runId = runId;
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

    public String getScenarioId() {
        return scenarioId;
    }

    public void setScenarioId(String scenarioId) {
        this.scenarioId = scenarioId;
    }

    public String getRunId() {
        return runId;
    }

    public void setRunId(String runId) {
        this.runId = runId;
    }
}
