package com.trafficjam.api.dto;

import com.trafficjam.matsim.MatsimRunner;

/**
 * Response DTO for simulation status queries.
 * Contains simulation ID, current status, and error message if failed.
 */
public class SimulationStatusResponse {

    private String simulationId;
    private MatsimRunner.SimulationState status;
    private String error;
    private Integer iteration;

    /**
     * Default constructor for Jackson deserialization.
     */
    public SimulationStatusResponse() {
    }

    /**
     * Creates a new simulation status response.
     *
     * @param simulationId the unique identifier for the simulation
     * @param status       the current state of the simulation
     * @param error        the error message if the simulation failed, or null
     * @param iteration    the current iteration number, or null
     */
    public SimulationStatusResponse(String simulationId, MatsimRunner.SimulationState status, String error,
            Integer iteration) {
        this.simulationId = simulationId;
        this.status = status;
        this.error = error;
        this.iteration = iteration;
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
     * @return the simulation state
     */
    public MatsimRunner.SimulationState getStatus() {
        return status;
    }

    public void setStatus(MatsimRunner.SimulationState status) {
        this.status = status;
    }

    /**
     * Gets the error message if the simulation failed.
     *
     * @return the error message or null
     */
    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    /**
     * Gets the current iteration number of the simulation.
     *
     * @return the iteration number or null
     */
    public Integer getIteration() {
        return iteration;
    }

    public void setIteration(Integer iteration) {
        this.iteration = iteration;
    }
}
