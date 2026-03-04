package com.trafficjam.api.dto;

/**
 * Request parameters for starting a new MatSim simulation.
 * Used with multipart file upload for network.xml file.
 * Plans file support will be added later for agent-based simulations.
 */
public class SimulationRequest {

    private Integer iterations;
    private Long randomSeed;

    /**
     * Default constructor.
     * Initializes iterations to 10 and uses a default random seed.
     */
    public SimulationRequest() {
        this.iterations = 10; // Default
        this.randomSeed = 4711L; // Default
    }

    /**
     * Constructs a request with specific iterations and random seed.
     *
     * @param iterations the number of iterations
     * @param randomSeed the random seed to use
     */
    public SimulationRequest(Integer iterations, Long randomSeed) {
        this.iterations = iterations;
        this.randomSeed = randomSeed;
    }

    /**
     * Gets the number of iterations.
     *
     * @return the number of iterations
     */
    public Integer getIterations() {
        return iterations;
    }

    /**
     * Sets the number of iterations.
     *
     * @param iterations the iteration count to set
     */
    public void setIterations(Integer iterations) {
        this.iterations = iterations;
    }

    /**
     * Gets the random seed.
     *
     * @return the random seed
     */
    public Long getRandomSeed() {
        return randomSeed;
    }

    /**
     * Sets the random seed.
     *
     * @param randomSeed the seed to set
     */
    public void setRandomSeed(Long randomSeed) {
        this.randomSeed = randomSeed;
    }
}
