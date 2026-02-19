package com.trafficjam.matsim;

import org.matsim.api.core.v01.Scenario;
import org.matsim.core.config.Config;
import org.matsim.core.config.ConfigUtils;
import org.matsim.core.controler.Controler;
import org.matsim.core.scenario.ScenarioUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Runs MatSim simulations programmatically.
 */
public class MatsimRunner {

    private static final Logger logger = LoggerFactory.getLogger(MatsimRunner.class);

    // Thread pool for running simulations concurrently
    private final ExecutorService executor = Executors.newFixedThreadPool(4);

    // Track active simulations by ID
    private final Map<String, SimulationInfo> activeSimulations = new ConcurrentHashMap<>();

    /**
     * Runs a MatSim simulation using the provided config file.
     * Blocks until simulation completes and outputs are written to disk.
     */
    public void runSimulation(String configPath) {
        // Load the scenario (network, population, config)
        Scenario scenario = loadScenario(configPath);

        // Create the Controler - the main simulation orchestrator
        Controler controler = new Controler(scenario);

        // Register event handlers (null callback = file output only, no streaming)
        registerEventHandlers(controler, null);

        // Run the simulation - this blocks until completion
        // MatSim will iterate through the configured number of iterations
        // and write output files (events.xml, plans.xml, network.xml) to the output
        // directory
        controler.run();
    }

    /**
     * Runs a MatSim simulation asynchronously in a background thread with event
     * streaming.
     * Returns immediately with a simulation ID that can be used to query status or
     * stop the simulation.
     */
    public String runSimulationAsync(String configPath, EventCallback eventCallback) {
        // TODO: When Python DB is implemented, the simulation ID will be passed as a
        // parameter
        // instead of being generated here. Python will create the ID and save it to the
        // DB first.
        // Method signature will become: runSimulationAsync(String simulationId, String
        // configPath, EventCallback callback)
        String simulationId = UUID.randomUUID().toString();

        // Load the scenario (network, population, config)
        Scenario scenario = loadScenario(configPath);

        // Create the Controler
        Controler controler = new Controler(scenario);

        // Register event handlers for streaming
        registerEventHandlers(controler, eventCallback);

        // Submit simulation to run in background thread
        executor.submit(() -> {
            try {
                logger.info("Starting simulation {} with config: {}", simulationId, configPath);

                // Update status to running
                SimulationInfo info = new SimulationInfo(Thread.currentThread(), "RUNNING");
                activeSimulations.put(simulationId, info);

                // Add listener to track iterations
                controler.addControlerListener((org.matsim.core.controler.listener.IterationStartsListener) event -> {
                    info.currentIteration = event.getIteration();
                });

                logger.info("Simulation {} status set to RUNNING, executing controler.run()", simulationId);

                // Run the simulation (blocks this background thread)
                controler.run();

                logger.info("Simulation {} completed successfully", simulationId);

                // Update status to completed
                info.status = "COMPLETED";

            } catch (Exception e) {
                // Check if this was an intentional interruption (stop command)
                if (e instanceof InterruptedException
                        || (e.getCause() != null && e.getCause() instanceof InterruptedException)) {
                    logger.info("Simulation {} was stopped by user request.", simulationId);

                    // Ensure status is marked as STOPPED if not already
                    SimulationInfo info = activeSimulations.get(simulationId);
                    if (info != null && !"STOPPED".equals(info.status)) {
                        info.status = "STOPPED";
                    }
                } else {
                    // unexpected error
                    logger.error("Simulation {} FAILED with exception: {}", simulationId, e.getMessage(), e);
                    logger.error("Exception type: {}", e.getClass().getName());
                    logger.error("Stack trace:", e);

                    // Update status to failed
                    SimulationInfo info = activeSimulations.get(simulationId);
                    if (info != null) {
                        info.status = "FAILED";
                        info.error = e.getMessage();
                    }
                    throw new RuntimeException("Simulation " + simulationId + " failed", e);
                }
            }
        });

        return simulationId;
    }

    /**
     * Loads and validates a MatSim scenario from the config file.
     */
    private Scenario loadScenario(String configPath) {
        // Disable strict DTD validation to allow modern network files with additional
        // attributes
        // This allows network files with attributes like "allowedModes" that aren't in
        // the v2 DTD
        System.setProperty("matsim.preferLocalDtds", "true");

        // Load the MatSim configuration from the XML file
        Config config = ConfigUtils.loadConfig(configPath);

        // Create and load the scenario (includes network and population)
        Scenario scenario = ScenarioUtils.loadScenario(config);

        // Validate that network and population were loaded successfully
        if (scenario.getNetwork().getNodes().isEmpty()) {
            throw new RuntimeException("Network is empty - check network file path in config");
        }
        if (scenario.getPopulation().getPersons().isEmpty()) {
            throw new RuntimeException("Population is empty - check plans file path in config");
        }

        return scenario;
    }

    /**
     * Registers custom event handlers to capture and stream simulation events.
     */
    private void registerEventHandlers(Controler controler, EventCallback eventCallback) {
        // Add event handlers to capture simulation events
        controler.addOverridingModule(new org.matsim.core.controler.AbstractModule() {
            @Override
            public void install() {
                // Register our custom event handler if callback is provided
                if (eventCallback != null) {
                    // Use EventHandler to filter, transform, and buffer events
                    EventHandler eventHandler = new EventHandler(eventCallback, 100); // Buffer size of 100
                    this.addEventHandlerBinding().toInstance(new org.matsim.core.events.handler.BasicEventHandler() {
                        @Override
                        public void handleEvent(org.matsim.api.core.v01.events.Event event) {
                            // EventHandler filters, transforms, buffers, and sends to callback
                            eventHandler.handleEvent(event);
                        }

                        @Override
                        public void reset(int iteration) {
                            // Flush any remaining events when iteration ends
                            eventHandler.cleanup();
                        }
                    });
                }
            }
        });
    }

    /**
     * Callback interface for streaming events in real-time.
     * Receives simplified TransformedEvent objects suitable for frontend streaming.
     */
    public interface EventCallback {
        void onEvent(EventHandler.TransformedEvent event);
    }

    /**
     * Holds information about a running simulation for tracking and management.
     */
    private static class SimulationInfo {
        final Thread thread;
        String status; // "RUNNING", "COMPLETED", "FAILED"
        String error; // Error message if failed
        Integer currentIteration; // Current iteration number

        SimulationInfo(Thread thread, String status) {
            this.thread = thread;
            this.status = status;
            this.currentIteration = 0;
        }
    }

    /**
     * Stops a running simulation gracefully.
     * 
     */
    public void stopSimulation(String simulationId) {
        SimulationInfo info = activeSimulations.get(simulationId);

        if (info == null) {
            throw new IllegalArgumentException("Simulation not found: " + simulationId);
        }

        // Interrupt the thread running the simulation
        if (info.thread != null && info.thread.isAlive()) {
            info.thread.interrupt();
            info.status = "STOPPED";
        }

        // TODO: When Python DB is implemented, add callback here to update database
        // status
        // statusCallback.onStatusChange(simulationId, "STOPPED", null);
    }

    /**
     * Gets the current status of a running simulation.
     */
    public SimulationStatus getSimulationStatus(String simulationId) {
        SimulationInfo info = activeSimulations.get(simulationId);

        if (info == null) {
            return null; // Simulation not found
        }

        return new SimulationStatus(simulationId, info.status, info.error, info.currentIteration);
    }

    /**
     * Status information for a simulation.
     */
    public static class SimulationStatus {
        public final String simulationId;
        public final String status; // "RUNNING", "COMPLETED", "FAILED", "STOPPED"
        public final String error; // Error message if failed, null otherwise
        public final Integer iteration;

        public SimulationStatus(String simulationId, String status, String error, Integer iteration) {
            this.simulationId = simulationId;
            this.status = status;
            this.error = error;
            this.iteration = iteration;
        }
    }
}
