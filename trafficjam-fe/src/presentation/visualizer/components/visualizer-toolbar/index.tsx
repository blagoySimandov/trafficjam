import { Layers, BarChart3 } from "lucide-react";
import styles from "./visualizer-toolbar.module.css";

interface VisualizerToolbarProps {
  showLinkVolume: boolean;
  onToggleLinkVolume: () => void;
  showAnalytics: boolean;
  onToggleAnalytics: () => void;
}

function ToggleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  const className = `${styles.toggleButton} ${active ? styles.toggleButtonActive : ""}`;
  return (
    <button className={className} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

export function VisualizerToolbar({
  showLinkVolume,
  onToggleLinkVolume,
  showAnalytics,
  onToggleAnalytics,
}: VisualizerToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <ToggleButton
        active={showLinkVolume}
        onClick={onToggleLinkVolume}
        icon={<Layers size={14} />}
        label="Link Volume"
      />
      <ToggleButton
        active={showAnalytics}
        onClick={onToggleAnalytics}
        icon={<BarChart3 size={14} />}
        label="Analytics"
      />
    </div>
  );
}
