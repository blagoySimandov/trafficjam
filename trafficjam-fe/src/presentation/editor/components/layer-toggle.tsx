import { useState } from "react";
import { Layers } from "lucide-react";
import { useClickAway } from "@uidotdev/usehooks";

interface LayerConfig {
  key: string;
  label: string;
  visible: boolean;
  onToggle: () => void;
}

interface LayerToggleProps {
  layers: LayerConfig[];
}

function LayerCheckbox({ label, visible, onToggle }: Omit<LayerConfig, "key">) {
  return (
    <label className="layer-toggle-row">
      <input type="checkbox" checked={visible} onChange={onToggle} />
      <span>{label}</span>
    </label>
  );
}

export function LayerToggle({ layers }: LayerToggleProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useClickAway<HTMLDivElement>(() => setOpen(false));

  return (
    <div className="leaflet-control leaflet-bar" ref={panelRef}>
      <a
        href="#"
        title="Toggle layers"
        onClick={(e) => {
          e.preventDefault();
          setOpen((prev) => !prev);
        }}
        className="map-control-btn"
      >
        <Layers size={18} />
      </a>
      {open && (
        <div className="layer-toggle-panel">
          {layers.map((layer) => (
            <LayerCheckbox
              key={layer.key}
              label={layer.label}
              visible={layer.visible}
              onToggle={layer.onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
