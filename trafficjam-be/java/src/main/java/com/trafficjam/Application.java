package com.trafficjam;

//i didnt get rid of this just in case, but it looks unused?
import org.matsim.api.core.v01.Coord;
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

        // test for conversion utils. make sure you import the class if you want to uncomment this and retest it
        // System.out.println("\n=== Testing CoordUtils ===");
        // Coord matsim = CoordUtils.toMatsim(-8.4756, 51.8985);
        // System.out.println("Cork City: " + matsim);
        // double[] back = CoordUtils.toGeoJson(matsim);
        // System.out.println("Back: [" + back[0] + ", " + back[1] + "]");
    }
}
