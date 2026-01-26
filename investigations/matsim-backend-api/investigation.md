# MatSim Backend Wrapper Implementation

# Frame the Problem

Understand what we are trying to achieve.

- Are we certain we are working on the right problem?
- Do we have all the research we need to understand it fully?
- Do we all understand the problem the same way?

Framing the problem brings clarity that makes taking the correct action easier.

---

### Why are we doing this work?

We need to integrate MatSim (a Java-based transport simulation engine) with our visualization platform. Currently, MatSim requires deep Java expertise and manual configuration of XML files. Our users need a simple API to run simulations without MatSim knowledge. The simulation generates thousands of events per second that must reach the visualizer with minimal latency for real-time animation.

### What outcome are we looking for?

**Primary Outcomes:**
- Visualizer can start MatSim simulations via simple API calls (JSON config instead of XML)
- Real-time event streaming to visualizer showing agent movements
- No MatSim expertise required for end users
- Support for multiple concurrent simulations

**Success Metrics:**
- API accepts high-level parameters (number of agents, behaviors, network) and runs simulation
- Events reach visualizer with under 100ms latency
- System handles simulations with 10,000+ agents
- Developer can start a simulation in under 5 API calls

## Propose solutions

### Solution 1: REST API with Spring Boot + Server-Sent Events (SSE)

**Architecture:**
```
Visualizer → REST (start/stop) → Spring Boot → MatSim → SSE stream → Visualizer
```

**How it works:**
- Client sends JSON config to REST endpoint
- Java service generates MatSim XML files
- MatSim runs in background thread
- Events stream to client via Server-Sent Events as they occur

**Pros:**
- Familiar technology stack (Spring Boot)
- Real-time event streaming
- Easy to test and debug (JSON, HTTP)
- Works in all browsers natively
- Moderate complexity
- Good performance (1,000-5,000 events/second)

**Cons:**
- JSON text format uses more bandwidth than binary
- One-way streaming only (client cannot send commands over same connection)
- Higher latency than gRPC (50-100ms per event)


---

### Solution 2: gRPC with Bidirectional Streaming

**Architecture:**
```
Visualizer → gRPC (bidirectional stream) → Java Service → MatSim → gRPC stream → Visualizer
```

**How it works:**
- Client opens gRPC stream to Java service
- Sends config via Protocol Buffers
- Java generates MatSim files and runs simulation
- Events stream back over same connection in binary format

**Pros:**
- Highest performance (10,000+ events/second)
- Lowest latency (under 10ms per event)
- Bidirectional communication (send commands while receiving events)
- Strongly typed contracts via Protocol Buffers
- Best for large-scale simulations

**Cons:**
- Higher learning curve (Protocol Buffers, gRPC)
- Harder to debug (binary format, need special tools)
- Browser clients require gRPC-Web proxy
- More infrastructure setup
- Less familiar to most teams

---

## Comparison Matrix

| Criteria | REST + SSE | gRPC Streaming |
|----------|------------|----------------|
| **Real-time Visualization** | Yes | Yes |
| **Performance (events/sec)** | 1K-5K | 10K+ |
| **Latency** | 50-100ms | Under 10ms |
| **Browser Support** | Native | Needs proxy |
| **Team Familiarity** | High | Low |
| **Debugging** | Easy (JSON/HTTP) | Harder (binary) |
| **Scalability** | Good | Excellent |

---

## Recommendation

**Start with REST API + Server-Sent Events**

### Recommendation Rationale

REST + SSE delivers the core requirements faster with lower risk:

1. **Lower risk** - Spring Boot and REST are well-known, less learning curve
2. **Sufficient performance** - 1K-5K events/second handles most use cases
3. **Easier debugging** - JSON and HTTP tools are familiar
4. **Browser compatible** - No proxy needed

**Migration path:** Start with REST + SSE. If performance measurements show latency issues or simulations exceed 50,000 agents, migrate to gRPC with data to justify the investment.

---

## Complete Flow Diagram
```
1. Visualizer → POST /simulations/start → Java API
2. Java API → Generate XML files → Start MatSim
3. Java API → Response with streamUrl → Visualizer
4. Visualizer → GET /events (SSE) → Java API
5. MatSim → Events → Java API → SSE → Visualizer (continuous)
6. Visualizer displays agents moving in real-time
7. (Optional) Visualizer → POST /stop → Java API → MatSim stops
```