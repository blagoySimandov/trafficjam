package com.trafficjam.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;

/**
 * Web configuration for CORS and other MVC settings.
 * Allows frontend applications to access the API.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {


    //the application properties
    @Value("${spring.web.cors.allowed-origins}")
    private String[] allowedOrigins;

    @Value("${matsim.output.directory}")
    private String outputDirectory;

    /**
     * Configures CORS mappings for all API endpoints.
     * Allows specified origins to make requests to the backend.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);

                // SimWrapper data endpoint — no credentials needed, just GET
        registry.addMapping("/simwrapper-data/**")
                .allowedOrigins("*")
                .allowedMethods("GET")
                .allowedHeaders("*");
    }


    /**
     * Serves MATSim output files statically so SimWrapper can read
     * dashboard YAML and CSV data files directly from the output directory.
     * Files are accessible at: /simwrapper-data/{scenarioId}/...
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Ensure the path ends with a slash for correct resolution
        String outputLocation = outputDirectory.endsWith("/")
                ? "file:" + outputDirectory
                : "file:" + outputDirectory + "/";

        registry.addResourceHandler("/simwrapper-data/**")
                .addResourceLocations(outputLocation)
                .setCacheControl(CacheControl.noCache());
    }
}
