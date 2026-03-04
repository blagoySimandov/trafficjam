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
    /**
     * Default constructor for Jackson deserialization.
     */
    public SimulationResponse() {
    }

    /**
     * Creates a response with just the simulation ID and status.
     *
     * @param simulationId the unique simulation identifier
     * @param status       the initial status
     */
    public SimulationResponse(String simulationId, String status) {
        this.simulationId = simulationId;
        this.status = status;
    }

    /**
     * Creates a full response including scenario and run IDs.
     *
     * @param simulationId the unique simulation identifier
     * @param status       the initial status
     * @param scenarioId   the related scenario identifier
     * @param runId        the related run identifier
     */
    public SimulationResponse(String simulationId, String status, String scenarioId, String runId) {
        this.simulationId = simulationId;
        this.status = status;
        this.scenarioId = scenarioId;
        this.runId = runId;
    }

    // Getters and Setters
    /**
     * Gets the simulation ID.
     *
     * @return the simulation ID
     */
    public String getSimulationId() {
        return simulationId;
    }

    public void setSimulationId(String simulationId) {
        this.simulationId = simulationId;
    }

    /**
     * Gets the current simulation status.
     *
     * @return the status string
     */
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    /**
     * Gets the associated scenario ID.
     *
     * @return the scenario ID
     */
    public String getScenarioId() {
        return scenarioId;
    }

    public void setScenarioId(String scenarioId) {
        this.scenarioId = scenarioId;
    }

    /**
     * Gets the associated run ID.
     *
     * @return the run ID
     */
    public String getRunId() {
        return runId;
    }

    public void setRunId(String runId) {
        this.runId = runId;
    }
}
