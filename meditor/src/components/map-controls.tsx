import { Download, Trash2, Upload, Building2, Building } from "lucide-react";

interface ControlButtonProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

function ControlButton({ title, icon, onClick, disabled }: ControlButtonProps) {
  return (
    <div className="leaflet-control leaflet-bar">
      <a
        href="#"
        title={title}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled) onClick();
        }}
        className="map-control-btn"
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
}

export function MapControls({
  onImport,
  onClear,
  onExport,
  loading,
  showBuildings,
  onToggleBuildings,
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
    </div>
  );
}
