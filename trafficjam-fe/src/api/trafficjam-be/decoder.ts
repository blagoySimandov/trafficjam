import type { StreamedEvent } from "./types";

function getReader(response: Response) {
  if (!response.body) throw new Error("Response body is null");
  return response.body.pipeThrough(new TextDecoderStream()).getReader();
}

function parseSSELine(line: string): StreamedEvent | null {
  if (!line.startsWith("data:")) return null;
  const json = line.slice("data:".length).trim();
  if (!json) return null;
  return JSON.parse(json) as StreamedEvent;
}

export async function* decodeEventStream(
  response: Response,
): AsyncGenerator<StreamedEvent> {
  const reader = getReader(response);
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop()!;
      for (const line of lines) {
        const event = parseSSELine(line);
        if (event) yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
