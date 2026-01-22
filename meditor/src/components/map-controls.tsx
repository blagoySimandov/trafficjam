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
}

export function MapControls({ onImport, onClear, loading }: MapControlsProps) {
  return (
    <div className="map-controls">
      <ControlButton
        title="Import OSM data"
        icon="📥"
        onClick={onImport}
        disabled={loading}
      />
      <ControlButton title="Clear network" icon="🗑️" onClick={onClear} />
    </div>
  );
}
