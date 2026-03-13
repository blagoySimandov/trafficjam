package com.trafficjam.service;

import com.trafficjam.matsim.ConfigGenerator;
import com.trafficjam.matsim.EventHandler;
import com.trafficjam.matsim.MatsimRunner;
import com.trafficjam.matsim.SimWrapperNatsPublisher;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class SimulationService {

  private final MatsimRunner matsimRunner;
  private final NatsJetStreamClient natsClient;
  private final SimWrapperNatsPublisher simWrapperNatsPublisher;

  @Value("${matsim.temp.directory}")
  private String tempDirectory;

  @Value("${matsim.output.directory}")
  private String outputDirectory;

  public SimulationService(NatsJetStreamClient natsClient, SimWrapperNatsPublisher simWrapperNatsPublisher) {
    this.matsimRunner = new MatsimRunner();
    this.natsClient = natsClient;
    this.simWrapperNatsPublisher = simWrapperNatsPublisher;
  }

  public record SimulationStartResult(String simulationId, String scenarioId, String runId) {
  }

  public SimulationStartResult startSimulation(MultipartFile networkFile, MultipartFile plansFile, Integer iterations,
      Long randomSeed, String scenarioId, String runId) throws IOException {
    if (!natsClient.isConnected()) {
      throw new IllegalStateException("Cannot start simulation: NATS JetStream is not connected");
    }

    final String finalScenarioId = (scenarioId == null || scenarioId.isEmpty()) ? UUID.randomUUID().toString()
        : scenarioId;
    final String finalRunId = (runId == null || runId.isEmpty()) ? UUID.randomUUID().toString() : runId;

    Path configPath = prepareSimulationFiles(finalScenarioId, networkFile, plansFile, iterations, randomSeed);

    natsClient.publishStatus(finalScenarioId, finalRunId, MatsimRunner.SimulationState.RUNNING.name());

    Path outputPath = Paths.get(outputDirectory, finalScenarioId);

    String actualSimId = matsimRunner.runSimulationAsync(
        configPath.toString(),
        event -> handleOutputEvent(finalScenarioId, finalRunId, event),
        (simId, status) -> {
          natsClient.publishStatus(finalScenarioId, finalRunId, status.name());
          if (MatsimRunner.SimulationState.COMPLETED == status) {
            simWrapperNatsPublisher.publishSimWrapperData(finalRunId, outputPath);
          }
        });

    return new SimulationStartResult(actualSimId, finalScenarioId, finalRunId);
  }

  private Path prepareSimulationFiles(String scenarioId, MultipartFile networkFile, MultipartFile plansFile,
      Integer iterations, Long randomSeed) throws IOException {
    Path simDir = Paths.get(tempDirectory, scenarioId);
    Files.createDirectories(simDir);

    Path networkPath = simDir.resolve("network.xml");
    networkFile.transferTo(networkPath.toFile());

    Path plansPath = simDir.resolve("plans.xml");
    plansFile.transferTo(plansPath.toFile());

    Path outputPath = Paths.get(outputDirectory, scenarioId);
    Files.createDirectories(outputPath);

    Path configPath = simDir.resolve("config.xml");
    ConfigGenerator generator = new ConfigGenerator();
    String configContent = generator.generateConfig(
        networkPath.toString(),
        plansPath.toString(),
        "EPSG:4326",
        outputPath.toString(),
        iterations,
        randomSeed.intValue());

    Files.writeString(configPath, configContent);
    return configPath;
  }

  private void handleOutputEvent(String scenarioId, String runId, EventHandler.TransformedEvent event) {
    natsClient.publishEvent(scenarioId, runId, event);
  }

  /**
   * Gets the current status of a running simulation.
   */
  public MatsimRunner.SimulationStatus getSimulationStatus(String simulationId) {
    return matsimRunner.getSimulationStatus(simulationId);
  }

  /**
   * Stops a running simulation gracefully.
   */
  public void stopSimulation(String simulationId) {
    matsimRunner.stopSimulation(simulationId);
  }

  /**
   * Streams simulation events in real-time via Server-Sent Events.
   */
  public void streamEvents(String simulationId, SseEmitter emitter) {
    // Verify simulation exists
    MatsimRunner.SimulationStatus status = matsimRunner.getSimulationStatus(simulationId);
    if (status == null) {
      emitter.completeWithError(new IllegalArgumentException("Simulation not found: " + simulationId));
      return;
    }

    // Start background thread to poll status and send updates
    new Thread(() -> {
      try {
        // Send initial connection message
        emitter.send(SseEmitter.event()
            .name("connected")
            .data("Streaming events for simulation: " + simulationId));

        // Poll status and send updates every second
        while (true) {
          MatsimRunner.SimulationStatus currentStatus = matsimRunner.getSimulationStatus(simulationId);

          if (currentStatus == null) {
            emitter.complete();
            break;
          }

          // Send status update
          MatsimRunner.SimulationState currentState = currentStatus.status;
          String statusText = currentState.name();
          if (MatsimRunner.SimulationState.RUNNING == currentState && currentStatus.iteration != null) {
            statusText += " - Iteration " + currentStatus.iteration;
          }

          emitter.send(SseEmitter.event()
              .name("status")
              .data(statusText));

          // Check if simulation finished
          if (MatsimRunner.SimulationState.COMPLETED == currentState ||
              MatsimRunner.SimulationState.FAILED == currentState ||
              MatsimRunner.SimulationState.STOPPED == currentState) {

            // Send final message
            emitter.send(SseEmitter.event()
                .name("finished")
                .data(currentState.name()));

            emitter.complete();
            break;
          }

          Thread.sleep(1000); // Poll every second
        }
      } catch (IOException e) {
        emitter.completeWithError(e);
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        emitter.completeWithError(e);
      }
    }).start();
  }}emitter.send(SseEmitter.event().name("status").data(statusText));

  // Check if simulation finished
  if(MatsimRunner.SimulationState.COMPLETED==currentState||MatsimRunner.SimulationState.FAILED==currentState||MatsimRunner.SimulationState.STOPPED==currentState){

  // Send final message
  emitter.send(SseEmitter.event().name("finished").data(currentState.name()));

  emitter.complete();break;}

  Thread.sleep(1000); // Poll every second
  }}catch(

  IOException e)
  {
    emitter.completeWithError(e);
  }catch(
  InterruptedException e)
  {
        Thread.currentThread().interrupt();
        emitter.completeWithError(e);
      }
}).start();}}
