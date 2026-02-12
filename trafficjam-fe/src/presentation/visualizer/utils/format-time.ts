function padTwo(n: number) {
  return n.toString().padStart(2, "0");
}

export function formatSimulationTime(seconds: number) {
  const h = Math.floor(seconds / 3600) % 24;
  const m = Math.floor((seconds % 3600) / 60);
  return `${padTwo(h)}:${padTwo(m)}`;
}
