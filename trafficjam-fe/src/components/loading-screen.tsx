import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  cityName?: string;
  message?: string;
}

const overlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 50,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255, 255, 255, 0.92)",
};

export function LoadingScreen({ cityName, message }: LoadingScreenProps) {
  const text = message ?? `Loading ${cityName} map data...`;
  return (
    <div style={overlay}>
      <Loader2 size={40} style={{ animation: "spin 1s linear infinite", color: "#2563eb" }} />
      <p style={{ marginTop: 16, fontSize: 18, fontWeight: 500, color: "#374151" }}>
        {text}
      </p>
    </div>
  );
}
