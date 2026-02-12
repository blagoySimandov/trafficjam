import { Download, Trash2, Upload, Pencil, Undo } from "lucide-react";
import { cn } from "../../../utils/cn";

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

interface EditorControlsProps {
  onImport: () => void;
  onClear: () => void;
  onExport: () => void;
  loading: boolean;
  layerToggle: React.ReactNode;
  editorMode?: boolean;
  onToggleEditorMode: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

export function EditorControls({
  onImport,
  onClear,
  onExport,
  loading,
  layerToggle,
  editorMode,
  onToggleEditorMode,
  onUndo,
  canUndo,
}: EditorControlsProps) {
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
      {layerToggle}
      <ControlButton
        title={"Toggle editor mode"}
        icon={<Pencil size={18} />}
        onClick={onToggleEditorMode}
        active={editorMode}
      />
      <ControlButton
        title={"Undo network changes (Cmd/Ctrl+Z)"}
        icon={<Undo size={18} />}
        onClick={onUndo}
        disabled={!canUndo}
      />
    </div>
  );
}
