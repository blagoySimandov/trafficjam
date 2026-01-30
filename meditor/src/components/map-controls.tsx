import { Download, Trash2, Upload, Building2, Building } from "lucide-react";
import { cn } from "../utils/cn"; // path depends on your project

interface ControlButtonProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}

function ControlButton({
  title,
  icon,
  onClick,
  disabled,
  active,
}: ControlButtonProps) {
  return (
    <div className="leaflet-control leaflet-bar">
      <a
        href="#"
        title={title}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled && onClick) onClick();
        }}
        className={cn("map-control-btn", active && "active")}
      >
        {icon}
      </a>
    </div>
  );
}

interface MapControlsProps {
  onImport: () => void;
  onClear: () => void;
  onExport: () => void;
  loading: boolean;
  showBuildings: boolean;
  onToggleBuildings: () => void;
  editorMode?: boolean;
  onToggleEditorMode?: () => void;
}

export function MapControls({
  onImport,
  onClear,
  onExport,
  loading,
  showBuildings,
  onToggleBuildings,
  editorMode,
  onToggleEditorMode,
}: MapControlsProps) {
  return (
    <div className="map-controls">
      <ControlButton
        title="Import OSM data"
        icon={<Download size={18} />}
        onClick={onImport}
        disabled={loading}
      />
      <ControlButton
        title="Export network"
        icon={<Upload size={18} />}
        onClick={onExport}
      />
      <ControlButton
        title="Clear network"
        icon={<Trash2 size={18} />}
        onClick={onClear}
      />
      <ControlButton
        title={showBuildings ? "Hide buildings" : "Show buildings"}
        icon={showBuildings ? <Building size={18} /> : <Building2 size={18} />}
        onClick={onToggleBuildings}
      />
      <ControlButton
        title={
          editorMode
            ? CONTROL_TITLES.EDITOR_MODE_OFF
            : CONTROL_TITLES.EDITOR_MODE_ON
        }
        icon={CONTROL_ICONS.EDITOR_MODE}
        onClick={onToggleEditorMode}
        active={editorMode}
      />
    </div>
  );
}
