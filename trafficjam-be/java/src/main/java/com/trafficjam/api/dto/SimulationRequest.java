package com.trafficjam.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for starting a new MatSim simulation.
 * Contains the path to the MatSim configuration file.
 */
public class SimulationRequest {

    @NotBlank(message = "Config path is required")
    private String configPath;

    // Constructors
    public SimulationRequest() {
    }

    public SimulationRequest(String configPath) {
        this.configPath = configPath;
    }

    // Getters and Setters
    public String getConfigPath() {
        return configPath;
    }

    public void setConfigPath(String configPath) {
        this.configPath = configPath;
    }
}
