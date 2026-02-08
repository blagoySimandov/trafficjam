package com.trafficjam.api.dto;

/**
 * Request parameters for starting a new MatSim simulation.
 * Used with multipart file upload for network.xml file.
 * Plans file support will be added later for agent-based simulations.
 */
public class SimulationRequest {

    private Integer iterations;
    private Long randomSeed;

    // Constructors
    public SimulationRequest() {
        this.iterations = 10; // Default
        this.randomSeed = 4711L; // Default
    }

    public SimulationRequest(Integer iterations, Long randomSeed) {
        this.iterations = iterations;
        this.randomSeed = randomSeed;
    }

    // Getters and Setters
    public Integer getIterations() {
        return iterations;
    }

    public void setIterations(Integer iterations) {
        this.iterations = iterations;
    }

    public Long getRandomSeed() {
        return randomSeed;
    }

    public void setRandomSeed(Long randomSeed) {
        this.randomSeed = randomSeed;
    }
}
