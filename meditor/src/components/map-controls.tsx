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
  loading: boolean;
  showBuildings: boolean;
  onToggleBuildings: () => void;
}

export function MapControls({
  onImport,
  onClear,
  loading,
  showBuildings,
  onToggleBuildings,
}: MapControlsProps) {
  return (
    <div className="map-controls">
      <ControlButton
        title={CONTROL_TITLES.IMPORT}
        icon={CONTROL_ICONS.IMPORT}
        onClick={onImport}
        disabled={loading}
      />
      <ControlButton
        title={CONTROL_TITLES.CLEAR}
        icon={CONTROL_ICONS.CLEAR}
        onClick={onClear}
      />
      <ControlButton
        title={showBuildings ? CONTROL_TITLES.BUILDINGS_HIDE : CONTROL_TITLES.BUILDINGS_SHOW}
        icon={showBuildings ? CONTROL_ICONS.BUILDINGS_HIDE : CONTROL_ICONS.BUILDINGS_SHOW}
        onClick={onToggleBuildings}
      />
    </div>
  );
}
