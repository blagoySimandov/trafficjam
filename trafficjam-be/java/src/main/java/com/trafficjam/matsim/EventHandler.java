package com.trafficjam.matsim;

import org.matsim.api.core.v01.events.Event;
import java.util.ArrayList;
import java.util.List;

/**
 * Custom event handler to capture and process MatSim events for streaming.
 * Filters, transforms, and buffers events before sending to callback.
 */
public class EventHandler {

    private final List<TransformedEvent> eventBuffer;
    private final int bufferSize;
    private final MatsimRunner.EventCallback callback;

    /**
     * Constructor for EventHandler.
     */
    public EventHandler(MatsimRunner.EventCallback callback, int bufferSize) {
        this.callback = callback;
        this.bufferSize = bufferSize;
        this.eventBuffer = new ArrayList<>();
    }

    /**
     * Main entry point - called by MatSim for every simulation event.
     * Filters, transforms, buffers, and potentially flushes events.
     */
    public void handleEvent(Event event) {
        if (!filterEvent(event)) {
            return; // Skip this event
        }

        TransformedEvent transformed = transformEvent(event);
        if (transformed == null) {
            return; // Skip if transformation failed
        }

        bufferEvent(transformed);

        if (shouldFlush()) {
            flushBuffer();
        }
    }

    /**
     * Determines if an event should be processed based on type and relevance.
     * Returns true for events needed for visualization (movement, activities).
     */
    private boolean filterEvent(Event event) {
        String eventType = event.getEventType();

        // Only process events relevant for visualization
        // Event type strings come from the XML file, not Java class names
        return eventType.equals("departure") ||
                eventType.equals("arrival") ||
                eventType.equals("entered link") ||
                eventType.equals("left link") ||
                eventType.equals("PersonEntersVehicle") ||
                eventType.equals("PersonLeavesVehicle") ||
                eventType.equals("vehicle enters traffic") ||
                eventType.equals("vehicle leaves traffic") ||
                // Activity events use single letters (h=home, w=work, etc.)
                eventType.length() == 1; // Captures all activity types (h, w, s, etc.)
    }

    /**
     * Converts a MatSim event to a simplified format for streaming.
     * Extracts only the data needed for visualization.
     */
    private TransformedEvent transformEvent(Event event) {
        String eventType = event.getEventType();
        double time = event.getTime();

        // Extract common attributes
        String agentId = (String) event.getAttributes().get("person");
        String linkId = (String) event.getAttributes().get("link");
        String activityType = (String) event.getAttributes().get("actType");

        return new TransformedEvent(eventType, time, agentId, linkId, activityType);
    }

    /**
     * Adds a transformed event to the buffer.
     * Events are batched for efficiency before sending to callback.
     */
    private void bufferEvent(TransformedEvent event) {
        eventBuffer.add(event);
    }

    /**
     * Determines if the buffer should be flushed.
     * Flushes when buffer is full or at time intervals.
     */
    private boolean shouldFlush() {
        return eventBuffer.size() >= bufferSize;
    }

    /**
     * Sends all buffered events to the callback and clears the buffer.
     * Called when buffer is full or simulation ends.
     */
    private void flushBuffer() {
        if (eventBuffer.isEmpty() || callback == null) {
            return;
        }

        // Send each event to callback
        for (TransformedEvent event : eventBuffer) {
            callback.onEvent(event);
        }

        // Clear the buffer
        eventBuffer.clear();
    }

    /**
     * Cleans up resources when simulation completes.
     * Flushes any remaining events and releases resources.
     */
    public void cleanup() {
        // Flush any remaining events in the buffer
        flushBuffer();
    }

    /**
     * Simplified event format for streaming to visualizer.
     * Contains only essential data needed for real-time visualization.
     */
    public static class TransformedEvent {
        public String type; // Event type (departure, arrival, link_enter, etc.)
        public double time; // Simulation time in seconds
        public String agentId; // Agent/person ID
        public String linkId; // Road link ID (if applicable)
        public String activityType; // Activity type (if applicable)
        public Double x; // X coordinate (if applicable)
        public Double y; // Y coordinate (if applicable)

        public TransformedEvent(String type, double time, String agentId, String linkId, String activityType) {
            this.type = type;
            this.time = time;
            this.agentId = agentId;
            this.linkId = linkId;
            this.activityType = activityType;
        }
    }
}
