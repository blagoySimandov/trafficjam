package com.trafficjam.matsim;

import org.matsim.api.core.v01.Coord;
import org.matsim.api.core.v01.Id;
import org.matsim.api.core.v01.events.Event;
import org.matsim.api.core.v01.network.Link;
import org.matsim.api.core.v01.network.Network;
import org.matsim.core.utils.geometry.CoordinateTransformation;
import org.matsim.core.utils.geometry.transformations.TransformationFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Custom MATSim event handler that captures network and population events
 * during a simulation run, transforms them into a unified format, and streams
 * them to a callback function (usually sending them to NATS).
 */
public class EventHandler implements org.matsim.core.events.handler.BasicEventHandler {

    private static final Set<String> RELEVANT_EVENTS = Set.of(
            "departure", "arrival", "entered link", "left link",
            "PersonEntersVehicle", "PersonLeavesVehicle",
            "vehicle enters traffic", "vehicle leaves traffic",
            "actstart", "actend");

    private static final Set<String> FROM_NODE_EVENTS = Set.of("entered link", "departure");
    private static final Set<String> TO_NODE_EVENTS = Set.of("left link", "arrival");

    private final List<TransformedEvent> eventBuffer;
    private final int bufferSize;
    private final MatsimRunner.EventCallback callback;
    private final Network network;
    private final CoordinateTransformation transformation;

    /**
     * Constructs the EventHandler.
     *
     * @param callback   the callback to execute when the buffer flushes
     * @param bufferSize the number of events to buffer before flushing
     * @param network    the MATSim network used for coordinate lookups
     */
    public EventHandler(MatsimRunner.EventCallback callback, int bufferSize, Network network) {
        this.callback = callback;
        this.bufferSize = bufferSize;
        this.network = network;
        this.eventBuffer = new ArrayList<>();
        this.transformation = TransformationFactory.getCoordinateTransformation(
                coordinateSystem, TransformationFactory.WGS84);
    }

    @Override
    public void reset(int iteration) {
        cleanup();
    }

    /**
     * Handles a triggered MATSim event. Only relevant events are buffered.
     *
     * @param event the MATSim event
     */
    public void handleEvent(Event event) {
        if (!RELEVANT_EVENTS.contains(event.getEventType()))
            return;

        TransformedEvent transformed = transformEvent(event);
        if (transformed == null)
            return;

        eventBuffer.add(transformed);

        if (eventBuffer.size() >= bufferSize) {
            flushBuffer();
        }
    }

    private TransformedEvent transformEvent(Event event) {
        Map<String, String> attrs = event.getAttributes();
        String eventType = event.getEventType();

        String agentId = extractAgentId(attrs);
        String linkId = (eventType.equals("PersonEntersVehicle") || eventType.equals("PersonLeavesVehicle"))
                ? attrs.get("vehicle")
                : attrs.get("link");
        Double[] coords = resolveCoordinates(attrs, linkId, eventType);

        return new TransformedEvent(
                eventType, event.getTime(), agentId, linkId,
                attrs.get("actType"), coords[0], coords[1]);
    }

    private String extractAgentId(Map<String, String> attrs) {
        String id = attrs.get("person");
        if (id != null)
            return id;
        id = attrs.get("driver");
        if (id != null)
            return id;
        return attrs.get("vehicle");
    }

    private Double[] resolveCoordinates(Map<String, String> attrs, String linkId, String eventType) {
        Double[] fromAttrs = parseCoordinatesFromAttrs(attrs);
        if (fromAttrs != null)
            return fromAttrs;

        Double[] fromNetwork = lookupCoordinatesFromNetwork(linkId, eventType);
        if (fromNetwork != null)
            return fromNetwork;

        return new Double[] { null, null };
    }

    private Double[] parseCoordinatesFromAttrs(Map<String, String> attrs) {
        String xStr = attrs.get("x");
        if (xStr == null)
            return null;
        try {
            return new Double[] { Double.parseDouble(xStr), Double.parseDouble(attrs.get("y")) };
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Double[] lookupCoordinatesFromNetwork(String linkId, String eventType) {
        if (linkId == null || network == null)
            return null;

        Link link = network.getLinks().get(Id.createLinkId(linkId));
        if (link == null)
            return null;

        Coord coord = pickCoordForEvent(link, eventType);
        if (coord == null)
            return null;

        return new Double[] { coord.getX(), coord.getY() };
    }

    private Coord pickCoordForEvent(Link link, String eventType) {
        if (FROM_NODE_EVENTS.contains(eventType))
            return link.getFromNode().getCoord();
        if (TO_NODE_EVENTS.contains(eventType))
            return link.getToNode().getCoord();
        return link.getCoord();
    }

    private void flushBuffer() {
        if (eventBuffer.isEmpty() || callback == null)
            return;

        for (TransformedEvent event : eventBuffer) {
            callback.onEvent(event);
        }
        eventBuffer.clear();
    }

    /**
     * Forces the buffer to flush its remaining events, intended for the end of an
     * iteration or simulation.
     */
    public void cleanup() {
        flushBuffer();
    }

    public static class TransformedEvent {
        public String type;
        public double time;
        public String agentId;
        public String linkId;
        public String activityType;
        public Double x;
        public Double y;

        public TransformedEvent(String type, double time, String agentId, String linkId, String activityType, Double x,
                Double y) {
            this.type = type;
            this.time = time;
            this.agentId = agentId;
            this.linkId = linkId;
            this.activityType = activityType;
            this.x = x;
            this.y = y;
        }
    }
}
