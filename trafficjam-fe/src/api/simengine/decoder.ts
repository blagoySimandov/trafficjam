import type { Event } from "../../types/matsim-events";

function getReader(response: Response) {
  const stream = response.body!
    .pipeThrough(new TextDecoderStream())
  return stream.getReader();
}

function parseSSELine(line: string): Event | null {
  if (!line.startsWith("data:")) return null;
  const json = line.slice("data:".length).trim();
  if (!json) return null;
  return JSON.parse(json) as Event;
}

export async function* decodeEventStream(
  response: Response,
): AsyncGenerator<Event> {
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
