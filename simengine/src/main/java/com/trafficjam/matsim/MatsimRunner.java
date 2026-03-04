package com.trafficjam.matsim;

import org.matsim.api.core.v01.Scenario;
import org.matsim.core.config.Config;
import org.matsim.core.config.ConfigUtils;
import org.matsim.core.controler.Controler;
import org.matsim.core.controler.OutputDirectoryHierarchy;
import org.matsim.core.network.algorithms.NetworkCleaner;
import org.matsim.core.scenario.ScenarioUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.matsim.simwrapper.SimWrapperModule;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MatsimRunner {

    private static final Logger logger = LoggerFactory.getLogger(MatsimRunner.class);
    private final ExecutorService executor = Executors.newFixedThreadPool(4);
    private final Map<String, SimulationInfo> activeSimulations = new ConcurrentHashMap<>();

    public enum SimulationState {
        RUNNING, COMPLETED, FAILED, STOPPED
    }

    public void runSimulation(String configPath) {
        Scenario scenario = loadScenario(configPath);
        Controler controler = new Controler(scenario);
        registerEventHandlers(controler, null, scenario);
        controler.run();
    }

    public String runSimulationAsync(String configPath, EventCallback eventCallback, StatusCallback statusCallback) {
        String simulationId = UUID.randomUUID().toString();
        Scenario scenario = loadScenario(configPath);
        Controler controler = new Controler(scenario);
        registerEventHandlers(controler, eventCallback, scenario);

        executor.submit(() -> {
            try {
                executeSimulation(simulationId, configPath, controler);
            } catch (Exception e) {
                handleSimulationFailure(simulationId, e, statusCallback);
                return;
            }
            statusCallback.onStatusChange(simulationId, SimulationState.COMPLETED);
        });

        return simulationId;
    }

    private void executeSimulation(String simulationId, String configPath, Controler controler) {
        logger.info("Starting simulation {} with config: {}", simulationId, configPath);

        SimulationInfo info = new SimulationInfo(Thread.currentThread(), SimulationState.RUNNING);
        activeSimulations.put(simulationId, info);

        controler.addControlerListener(
                (org.matsim.core.controler.listener.IterationStartsListener) event -> info.currentIteration = event
                        .getIteration());

        controler.run();
        logger.info("Simulation {} completed successfully", simulationId);
        info.status = SimulationState.COMPLETED;
    }

    private void handleSimulationFailure(String simulationId, Exception e, StatusCallback statusCallback) {
        if (isInterruption(e)) {
            logger.info("Simulation {} was stopped by user request.", simulationId);
            SimulationInfo info = activeSimulations.get(simulationId);
            if (info != null && SimulationState.STOPPED != info.status)
                info.status = SimulationState.STOPPED;
            statusCallback.onStatusChange(simulationId, SimulationState.STOPPED);
            return;
        }

        Throwable cause = e;
        while (cause != null) {
            logger.error("CAUSE: {}: {}", cause.getClass().getName(), cause.getMessage());
            cause = cause.getCause();
        }

        logger.error("Simulation {} FAILED: {}", simulationId, e.getMessage(), e);
        SimulationInfo info = activeSimulations.get(simulationId);
        if (info != null) {
            info.status = SimulationState.FAILED;
            info.error = e.getMessage();
        }
        statusCallback.onStatusChange(simulationId, SimulationState.FAILED);
    }

    private boolean isInterruption(Exception e) {
        return e instanceof InterruptedException
                || (e.getCause() != null && e.getCause() instanceof InterruptedException);
    }

    private Scenario loadScenario(String configPath) {
        System.setProperty("matsim.preferLocalDtds", "true");
        Config config = ConfigUtils.loadConfig(configPath);
        config.controller()
                .setOverwriteFileSetting(OutputDirectoryHierarchy.OverwriteFileSetting.overwriteExistingFiles);

        Scenario scenario = ScenarioUtils.loadScenario(config);
        new NetworkCleaner().run(scenario.getNetwork());
        validateScenario(scenario);
        return scenario;
    }

    private void validateScenario(Scenario scenario) {
        if (scenario.getNetwork().getNodes().isEmpty()) {
            throw new RuntimeException("Network is empty - check network file path in config");
        }
        if (scenario.getPopulation().getPersons().isEmpty()) {
            throw new RuntimeException("Population is empty - check plans file path in config");
        }
    }

    private void registerEventHandlers(Controler controler, EventCallback eventCallback, Scenario scenario) {
        // Add SimWrapper module — generates dashboards automatically after simulation
        controler.addOverridingModule(new SimWrapperModule());

        if (eventCallback == null)
            return;

        controler.addOverridingModule(new org.matsim.core.controler.AbstractModule() {
            @Override
            public void install() {
                addEventHandlerBinding().toInstance(
                        new EventHandler(eventCallback, 1, scenario.getNetwork(),
                                scenario.getConfig().global().getCoordinateSystem()));
            }
        });
    }

    public interface EventCallback {
        void onEvent(EventHandler.TransformedEvent event);
    }

    public interface StatusCallback {
        void onStatusChange(String simulationId, SimulationState status);
    }

    public void stopSimulation(String simulationId) {
        SimulationInfo info = activeSimulations.get(simulationId);
        if (info == null)
            throw new IllegalArgumentException("Simulation not found: " + simulationId);

        if (info.thread != null && info.thread.isAlive()) {
            info.thread.interrupt();
            info.status = SimulationState.STOPPED;
        }
    }

    public SimulationStatus getSimulationStatus(String simulationId) {
        SimulationInfo info = activeSimulations.get(simulationId);
        if (info == null)
            return null;
        return new SimulationStatus(simulationId, info.status, info.error, info.currentIteration);
    }

    private static class SimulationInfo {
        final Thread thread;
        SimulationState status;
        String error;
        Integer currentIteration;

        SimulationInfo(Thread thread, SimulationState status) {
            this.thread = thread;
            this.status = status;
            this.currentIteration = 0;
        }
    }

    public static class SimulationStatus {
        public final String simulationId;
        public final SimulationState status;
        public final String error;
        public final Integer iteration;

        public SimulationStatus(String simulationId, SimulationState status, String error, Integer iteration) {
            this.simulationId = simulationId;
            this.status = status;
            this.error = error;
            this.iteration = iteration;
        }
    }
}
