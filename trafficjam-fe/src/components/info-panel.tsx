interface InfoPanelProps {
  title: string;
  data: Record<string, unknown>;
}

export function InfoPanel({ title, data }: InfoPanelProps) {
  return (
    <div id="info">
      <strong>{title}</strong>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
