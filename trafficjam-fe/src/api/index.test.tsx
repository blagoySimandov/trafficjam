import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { decodeEventStream } from "./trafficjam-be/decoder";
import { simulationApi } from "./trafficjam-be/client";
import { useSimulation } from "./index";
import { mapNetworkResponse } from "./map-data-service/decoder";
import { mapDataApi } from "./map-data-service/client";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function createSSEResponse(lines: string[]): Response {
  const text = lines.join("\n") + "\n";
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("decodeEventStream", () => {
  it("parses a single SSE event", async () => {
    const event = { time: 100, type: "entered link", vehicle: "v1", link: "l1" };
    const response = createSSEResponse([`data: ${JSON.stringify(event)}`]);
    const events = [];
    for await (const e of decodeEventStream(response)) events.push(e);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(event);
  });

  it("parses multiple SSE events", async () => {
    const e1 = { time: 100, type: "entered link", vehicle: "v1", link: "l1" };
    const e2 = { time: 200, type: "left link", vehicle: "v1", link: "l1" };
    const response = createSSEResponse([
      `data: ${JSON.stringify(e1)}`,
      `data: ${JSON.stringify(e2)}`,
    ]);
    const events = [];
    for await (const e of decodeEventStream(response)) events.push(e);
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual(e1);
    expect(events[1]).toEqual(e2);
  });

  it("skips empty lines and non-data lines", async () => {
    const event = { time: 100, type: "departure", person: "p1", link: "l1", legMode: "car" };
    const response = createSSEResponse([
      "",
      ": comment",
      `data: ${JSON.stringify(event)}`,
      "",
    ]);
    const events = [];
    for await (const e of decodeEventStream(response)) events.push(e);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(event);
  });

  it("handles chunked delivery", async () => {
    const event = { time: 100, type: "entered link", vehicle: "v1", link: "l1" };
    const full = `data: ${JSON.stringify(event)}\n`;
    const mid = Math.floor(full.length / 2);

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(full.slice(0, mid)));
        controller.enqueue(new TextEncoder().encode(full.slice(mid)));
        controller.close();
      },
    });
    const response = new Response(stream);

    const events = [];
    for await (const e of decodeEventStream(response)) events.push(e);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(event);
  });

  it("yields nothing for empty stream", async () => {
    const response = createSSEResponse([]);
    const events = [];
    for await (const e of decodeEventStream(response)) events.push(e);
    expect(events).toHaveLength(0);
  });
});

describe("simulationApi.startRun", () => {
  it("sends POST with form data and returns response", async () => {
    const expected = { scenario_id: "s1", run_id: "r1", simulation_id: "sim1", status: "RUNNING" };
    mockFetch.mockResolvedValueOnce(jsonResponse(expected));

    const file = new File(["<network/>"], "network.xml", { type: "text/xml" });
    const result = await simulationApi.startRun({ scenarioId: "s1", networkFile: file, iterations: 10 });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("/scenarios/s1/runs/start");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    expect(result).toEqual(expected);
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));
    const file = new File([""], "network.xml");
    await expect(simulationApi.startRun({ scenarioId: "s1", networkFile: file })).rejects.toThrow("500");
  });
});

describe("simulationApi.createRun", () => {
  it("sends POST and returns run", async () => {
    const expected = { scenario_id: "s1", run_id: "r1", status: "PENDING" };
    mockFetch.mockResolvedValueOnce(jsonResponse(expected));

    const result = await simulationApi.createRun("s1");

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch.mock.calls[0][0]).toContain("/scenarios/s1/runs");
    expect(result).toEqual(expected);
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 404 }));
    await expect(simulationApi.createRun("bad")).rejects.toThrow("404");
  });
});

describe("simulationApi.streamEvents", () => {
  it("fetches and yields decoded events", async () => {
    const event = { time: 100, type: "entered link", vehicle: "v1", link: "l1" };
    mockFetch.mockResolvedValueOnce(createSSEResponse([`data: ${JSON.stringify(event)}`]));

    const events = [];
    for await (const e of simulationApi.streamEvents("s1", "r1")) events.push(e);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("/scenarios/s1/runs/r1/events/stream");
    expect(init.headers.Accept).toBe("text/event-stream");
    expect(events).toEqual([event]);
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));
    const gen = simulationApi.streamEvents("s1", "r1");
    await expect(gen.next()).rejects.toThrow("500");
  });
});

describe("mapNetworkResponse", () => {
  it("maps nodes with string id, swapped coords, and camelCase count", () => {
    const api = {
      nodes: [{ id: 1, position: [10.5, 52.3] as [number, number], connection_count: 3 }],
      links: [],
      buildings: [],
      transport_routes: [],
    };
    const network = mapNetworkResponse(api);
    expect(network.nodes.get("1")).toEqual({ id: "1", position: [52.3, 10.5], connectionCount: 3 });
  });

  it("maps links with string ids, swapped geometry, and parsed tags", () => {
    const api = {
      nodes: [],
      links: [
        {
          id: 2,
          from_node: 1,
          to_node: 3,
          geometry: [[10.5, 52.3]] as [number, number][],
          tags: { highway: "primary", lanes: "2", maxspeed: "50", oneway: "yes" },
        },
      ],
      buildings: [],
      transport_routes: [],
    };
    const network = mapNetworkResponse(api);
    expect(network.links.get("2")).toEqual({
      id: "2",
      from: "1",
      to: "3",
      geometry: [[52.3, 10.5]],
      tags: { highway: "primary", lanes: 2, maxspeed: 50, oneway: true, name: undefined },
    });
  });

  it("skips buildings with a null type", () => {
    const api = {
      nodes: [],
      links: [],
      buildings: [{ id: 5, position: [10.5, 52.3] as [number, number], geometry: [], type: null, tags: {} }],
      transport_routes: [],
    };
    const network = mapNetworkResponse(api);
    expect(network.buildings?.size ?? 0).toBe(0);
  });

  it("maps buildings with a type and swapped coords", () => {
    const api = {
      nodes: [],
      links: [],
      buildings: [
        {
          id: 6,
          position: [10.5, 52.3] as [number, number],
          geometry: [[10.6, 52.4]] as [number, number][],
          type: "residential",
          tags: { name: "Block A", building: "yes", shop: undefined as unknown as string, amenity: undefined as unknown as string },
        },
      ],
      transport_routes: [],
    };
    const network = mapNetworkResponse(api);
    const building = network.buildings?.get("6");
    expect(building).toBeDefined();
    expect(building?.position).toEqual([52.3, 10.5]);
    expect(building?.geometry).toEqual([[52.4, 10.6]]);
    expect(building?.type).toBe("residential");
  });

  it("maps transport routes with nested swapped geometry", () => {
    const api = {
      nodes: [],
      links: [],
      buildings: [],
      transport_routes: [
        {
          id: 7,
          geometry: [[[10.5, 52.3], [10.6, 52.4]]] as [number, number][][],
          tags: { route: "bus", ref: "42", name: "City Loop", network: "VVS", operator: "SSB", colour: "#ff0000" },
        },
      ],
    };
    const network = mapNetworkResponse(api);
    expect(network.transportRoutes?.get("7")).toEqual({
      id: "7",
      geometry: [[[52.3, 10.5], [52.4, 10.6]]],
      tags: { route: "bus", ref: "42", name: "City Loop", network: "VVS", operator: "SSB", colour: "#ff0000" },
    });
  });
});

describe("mapDataApi.fetchNetworkData", () => {
  it("calls fetch with the correct URL and query params", async () => {
    const apiData = { nodes: [], links: [], buildings: [], transport_routes: [] };
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(apiData), { status: 200 }));

    const bounds = {
      getSouth: () => 48.1,
      getNorth: () => 48.2,
      getWest: () => 11.5,
      getEast: () => 11.6,
    } as unknown as Parameters<typeof mapDataApi.fetchNetworkData>[0];

    await mapDataApi.fetchNetworkData(bounds);

    expect(mockFetch).toHaveBeenCalledOnce();
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/network?");
    expect(url).toContain("min_lat=48.1");
    expect(url).toContain("max_lat=48.2");
    expect(url).toContain("min_lng=11.5");
    expect(url).toContain("max_lng=11.6");
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 503 }));

    const bounds = {
      getSouth: () => 0,
      getNorth: () => 1,
      getWest: () => 0,
      getEast: () => 1,
    } as unknown as Parameters<typeof mapDataApi.fetchNetworkData>[0];

    await expect(mapDataApi.fetchNetworkData(bounds)).rejects.toThrow("503");
  });

  it("returns the decoded network", async () => {
    const apiData = {
      nodes: [{ id: 1, position: [10.5, 52.3], connection_count: 2 }],
      links: [],
      buildings: [],
      transport_routes: [],
    };
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(apiData), { status: 200 }));

    const bounds = {
      getSouth: () => 0,
      getNorth: () => 1,
      getWest: () => 0,
      getEast: () => 1,
    } as unknown as Parameters<typeof mapDataApi.fetchNetworkData>[0];

    const network = await mapDataApi.fetchNetworkData(bounds);
    expect(network.nodes.get("1")).toEqual({ id: "1", position: [52.3, 10.5], connectionCount: 2 });
  });
});

describe("useSimulation", () => {
  it("start mutation calls simulationApi.startRun", async () => {
    const response = { scenario_id: "s1", run_id: "r1", simulation_id: "sim1", status: "RUNNING" };
    mockFetch.mockResolvedValueOnce(jsonResponse(response));

    const { result } = renderHook(() => useSimulation("s1"), {
      wrapper: createWrapper(),
    });

    const file = new File([""], "network.xml");
    result.current.start.mutate({ scenarioId: "s1", networkFile: file });

    await waitFor(() => expect(result.current.start.isSuccess).toBe(true));
    expect(result.current.start.data).toEqual(response);
  });

  it("createRun mutation calls simulationApi.createRun", async () => {
    const response = { scenario_id: "s1", run_id: "r1", status: "PENDING" };
    mockFetch.mockResolvedValueOnce(jsonResponse(response));

    const { result } = renderHook(() => useSimulation("s1"), {
      wrapper: createWrapper(),
    });

    result.current.createRun.mutate("s1");

    await waitFor(() => expect(result.current.createRun.isSuccess).toBe(true));
    expect(result.current.createRun.data).toEqual(response);
  });
});
