import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { decodeEventStream } from "./simengine/decoder";
import { simulationApi } from "./simengine/client";
import { useSimulation } from "./index";

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

describe("simulationApi.start", () => {
  it("sends POST with form data and returns response", async () => {
    const expected = { simulationId: "abc", status: "running" };
    mockFetch.mockResolvedValueOnce(jsonResponse(expected));

    const file = new File(["<network/>"], "network.xml", { type: "text/xml" });
    const result = await simulationApi.start({ networkFile: file, iterations: 10 });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/simulations");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    expect(result).toEqual(expected);
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));
    const file = new File([""], "network.xml");
    await expect(simulationApi.start({ networkFile: file })).rejects.toThrow("500");
  });
});

describe("simulationApi.getStatus", () => {
  it("sends GET and returns status", async () => {
    const expected = { simulationId: "abc", status: "completed" };
    mockFetch.mockResolvedValueOnce(jsonResponse(expected));

    const result = await simulationApi.getStatus("abc");

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch.mock.calls[0][0]).toContain("/api/simulations/abc/status");
    expect(result).toEqual(expected);
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 404 }));
    await expect(simulationApi.getStatus("bad")).rejects.toThrow("404");
  });
});

describe("simulationApi.stop", () => {
  it("sends DELETE request", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await simulationApi.stop("abc");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/simulations/abc");
    expect(init.method).toBe("DELETE");
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));
    await expect(simulationApi.stop("abc")).rejects.toThrow("500");
  });
});

describe("useSimulation", () => {
  it("fetches status when id is provided", async () => {
    const statusData = { simulationId: "abc", status: "running" };
    mockFetch.mockResolvedValueOnce(jsonResponse(statusData));

    const { result } = renderHook(() => useSimulation("abc"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.status.isSuccess).toBe(true));
    expect(result.current.status.data).toEqual(statusData);
  });

  it("does not fetch status when id is undefined", () => {
    const { result } = renderHook(() => useSimulation(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.status.isFetching).toBe(false);
  });

  it("start mutation calls simulationApi.start", async () => {
    const response = { simulationId: "new", status: "starting" };
    mockFetch.mockResolvedValueOnce(jsonResponse(response));

    const { result } = renderHook(() => useSimulation(undefined), {
      wrapper: createWrapper(),
    });

    const file = new File([""], "network.xml");
    result.current.start.mutate({ networkFile: file });

    await waitFor(() => expect(result.current.start.isSuccess).toBe(true));
    expect(result.current.start.data).toEqual(response);
  });

  it("stop mutation calls simulationApi.stop", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    const { result } = renderHook(() => useSimulation(undefined), {
      wrapper: createWrapper(),
    });

    result.current.stop.mutate("abc");

    await waitFor(() => expect(result.current.stop.isSuccess).toBe(true));
  });
});
