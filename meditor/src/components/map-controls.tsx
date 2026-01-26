import { CONTROL_ICONS, CONTROL_TITLES } from "../constants";

interface ControlButtonProps {
  title: string;
  icon: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}

function ControlButton({ title, icon, onClick, disabled, active }: ControlButtonProps) {
  return (
    <div className="leaflet-control leaflet-bar">
      <a
        href="#"
        title={title}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled && onClick) onClick();
        }}
        className={`map-control-btn ${active ? "active" : ""}`}
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
  onToggleEditorMode
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
        title={CONTROL_TITLES.EXPORT}
        icon={CONTROL_ICONS.EXPORT}
        onClick={onExport}
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
       <ControlButton
        title={editorMode ? CONTROL_TITLES.EDITOR_MODE_OFF : CONTROL_TITLES.EDITOR_MODE_ON}
        icon={CONTROL_ICONS.EDITOR_MODE}
        onClick={onToggleEditorMode}
        active={editorMode}
      />
    </div>
  );
}
