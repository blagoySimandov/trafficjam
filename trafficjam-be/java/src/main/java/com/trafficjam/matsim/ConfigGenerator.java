package com.trafficjam.matsim;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

/**
 * Generates MatSim configuration files using a template-based approach.
 * 
 * Reads a static config template from resources and replaces dynamic
 * placeholders:
 * - {{COORDINATE_SYSTEM}} - Coordinate system (default: EPSG:2157 for Cork ITM)
 * - {{NETWORK_FILE}} - Path to network XML
 * - {{PLANS_FILE}} - Path to plans/population XML
 * - {{OUTPUT_DIR}} - Output directory for simulation results
 * - {{ITERATIONS}} - Number of iterations to run
 * - {{RANDOM_SEED}} - Random seed for reproducibility
 * 
 * All other configuration (scoring, routing, qsim, etc.) is static and defined
 * in the template file: src/main/resources/config-template.xml
 */
public class ConfigGenerator {

    private static final String TEMPLATE_PATH = "/config-template.xml";

    // Default values for optional parameters
    private static final String DEFAULT_COORDINATE_SYSTEM = "EPSG:2157"; // Cork ITM
    private static final int DEFAULT_ITERATIONS = 10;

    // Generate a random seed by default for simulation variety
    private static int generateRandomSeed() {
        return java.util.concurrent.ThreadLocalRandom.current().nextInt(1, 1000000);
    }

    private static final int DEFAULT_RANDOM_SEED = generateRandomSeed();
    private static final String DEFAULT_OUTPUT_DIR = "./output";

    /**
     * Generate a MatSim config.xml with default settings.
     */
    public String generateConfig(String networkXml, String plansXml) {
        return generateConfig(networkXml, plansXml, DEFAULT_COORDINATE_SYSTEM, DEFAULT_OUTPUT_DIR, DEFAULT_ITERATIONS);
    }

    /**
     * Generate a MatSim config.xml with custom coordinate system, output directory
     * and iterations.
     */
    public String generateConfig(String networkXml, String plansXml, String coordinateSystem,
            String outputDir, int iterations) {
        return generateConfig(networkXml, plansXml, coordinateSystem, outputDir, iterations, DEFAULT_RANDOM_SEED);
    }

    /**
     * Generate a MatSim config.xml with full customization.
     */
    public String generateConfig(String networkXml, String plansXml, String coordinateSystem,
            String outputDir, int iterations, int randomSeed) {
        // Load the template from resources
        String template = loadTemplate();

        // Replace all dynamic placeholders with actual values
        String config = template
                .replace("{{COORDINATE_SYSTEM}}", coordinateSystem)
                .replace("{{NETWORK_FILE}}", networkXml)
                .replace("{{PLANS_FILE}}", plansXml)
                .replace("{{OUTPUT_DIR}}", outputDir)
                .replace("{{ITERATIONS}}", String.valueOf(iterations))
                .replace("{{RANDOM_SEED}}", String.valueOf(randomSeed));

        return config;
    }

    /**
     * Load the config template from resources.
     */
    private String loadTemplate() {
        try (InputStream inputStream = getClass().getResourceAsStream(TEMPLATE_PATH)) {
            if (inputStream == null) {
                throw new RuntimeException("Config template not found: " + TEMPLATE_PATH);
            }

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
                return reader.lines().collect(Collectors.joining("\n"));
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to load config template: " + TEMPLATE_PATH, e);
        }
    }
}
