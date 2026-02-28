import {
  Upload,
  Trash2,
  Building2,
  Building,
  Pencil,
  Undo,
} from "lucide-react";
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
  onClear: () => void;
  onExport: () => void;
  showBuildings: boolean;
  onToggleBuildings: () => void;
  editorMode?: boolean;
  onToggleEditorMode: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

export function EditorControls({
  onClear,
  onExport,
  showBuildings,
  onToggleBuildings,
  editorMode,
  onToggleEditorMode,
  onUndo,
  canUndo,
}: EditorControlsProps) {
  return (
    <div className="map-controls">
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
