package com.trafficjam;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main Spring Boot application entry point for TrafficJam MatSim backend.
 * 
 * This application provides a REST API for running MatSim simulations,
 * streaming events, and managing simulation lifecycle.
 */
@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
