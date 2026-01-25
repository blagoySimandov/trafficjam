import { CONTROL_ICONS, CONTROL_TITLES } from "../constants";

interface ControlButtonProps {
  title: string;
  icon: string;
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
  onExport?: () => void;
  loading: boolean;
  showBuildings: boolean;
  onToggleBuildings: () => void;
}

export function MapControls({ onImport, onClear, onExport, loading }: MapControlsProps) {
  return (
    <div className="map-controls">
      <ControlButton
        title={CONTROL_TITLES.IMPORT}
        icon={CONTROL_ICONS.IMPORT}
        onClick={onImport}
        disabled={loading}
      />
      <ControlButton title="Clear network" icon="🗑️" onClick={onClear} />
      <ControlButton
        title="Export network (MATSim XML)"
        icon="🚀"
        onClick={() => {
          if (onExport) onExport();
        }}
      />
    </div>
  );
}
