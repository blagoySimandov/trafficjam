// meditor/src/components/editor-panel.tsx
import type { EditableLink } from "../hooks/use-editor-mode";
import type { EditorTool } from "../hooks/use-editor-mode";
import type { BuildingType } from "../types";
import styles from "./editor-panel.module.css";

interface EditorPanelProps {
  isActive: boolean;
  tool: EditorTool;
  selectedLink: EditableLink | null;
  selectedBuildingType: BuildingType | null;
  drawingPoints: number;
  onToggle: () => void;
  onToolChange: (tool: EditorTool) => void;
  onBuildingTypeChange: (type: BuildingType) => void;
  onUpdateLink: (linkId: string, updates: Partial<EditableLink["tags"]>) => void;
  onFinishDrawing: (tags: EditableLink["tags"]) => void;
  onCancelDrawing: () => void;
  onDeleteLink: (linkId: string) => void;
}

const BUILDING_TYPES: BuildingType[] = [
  "retail",
  "apartments",
  "supermarket",
  "school",
  "kindergarten",
  "parking",
];

export function EditorPanel({
  isActive,
  tool,
  selectedLink,
  selectedBuildingType,
  drawingPoints,
  onToggle,
  onToolChange,
  onBuildingTypeChange,
  onUpdateLink,
  onFinishDrawing,
  onCancelDrawing,
  onDeleteLink,
}: EditorPanelProps) {
  return (
    <div className={styles.container}>
      <button onClick={onToggle} className={styles.toggleButton}>
        {isActive ? "Exit Editor" : "Enter Editor"}
      </button>

      {isActive && (
        <div className={styles.panel}>
          <h3 className={styles.title}>Map Editor</h3>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Tools</h4>
            <div className={styles.toolButtons}>
              <button
                onClick={() => onToolChange("select")}
                className={`${styles.toolButton} ${tool === "select" ? styles.active : ""}`}
              >
                Select
              </button>
              <button
                onClick={() => onToolChange("draw-road")}
                className={`${styles.toolButton} ${tool === "draw-road" ? styles.active : ""}`}
              >
                Draw Road
              </button>
              <button
                onClick={() => onToolChange("add-building")}
                className={`${styles.toolButton} ${tool === "add-building" ? styles.active : ""}`}
              >
                Add Building
              </button>
            </div>
          </div>

          {tool === "draw-road" && (
            <div className={styles.section}>
              <p className={styles.instruction}>
                Click on existing nodes or roads to create a new road. 
                {drawingPoints === 0 && " Start by clicking on an existing node."}
                {drawingPoints > 0 && ` (${drawingPoints} points)`}
              </p>
              {drawingPoints >= 2 && (
                <div className={styles.drawingControls}>
                  <button
                    onClick={() => {
                      const highway = prompt("Road type (e.g., residential, primary):", "residential");
                      const lanes = prompt("Number of lanes:", "2");
                      const maxspeed = prompt("Max speed (km/h):", "50");
                      const name = prompt("Road name (optional):", "");
                      
                      if (highway) {
                        onFinishDrawing({
                          highway,
                          lanes: lanes ? parseInt(lanes) : 2,
                          maxspeed: maxspeed ? parseInt(maxspeed) : undefined,
                          name: name || undefined,
                        });
                      }
                    }}
                    className={styles.finishButton}
                  >
                    Finish Road
                  </button>
                  <button onClick={onCancelDrawing} className={styles.cancelButton}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {tool === "add-building" && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Building Type</h4>
              <div className={styles.presetButtons}>
                {BUILDING_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => onBuildingTypeChange(type)}
                    className={`${styles.presetButton} ${selectedBuildingType === type ? styles.active : ""}`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
              <p className={styles.instruction}>
                Click on the map to place, then drag corners to resize
              </p>
            </div>
          )}

          {selectedLink && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Edit Link</h4>
              <div className={styles.form}>
                <label className={styles.label}>
                  Road Type:
                  <input
                    type="text"
                    value={selectedLink.tags.highway}
                    onChange={(e) =>
                      onUpdateLink(selectedLink.id, { highway: e.target.value })
                    }
                    className={styles.input}
                  />
                </label>

                <label className={styles.label}>
                  Lanes:
                  <input
                    type="number"
                    value={selectedLink.tags.lanes || 1}
                    onChange={(e) =>
                      onUpdateLink(selectedLink.id, {
                        lanes: parseInt(e.target.value) || 1,
                      })
                    }
                    min="1"
                    max="8"
                    className={styles.input}
                  />
                </label>

                <label className={styles.label}>
                  Max Speed (km/h):
                  <input
                    type="number"
                    value={selectedLink.tags.maxspeed || ""}
                    onChange={(e) =>
                      onUpdateLink(selectedLink.id, {
                        maxspeed: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    min="10"
                    max="130"
                    className={styles.input}
                  />
                </label>

                <label className={styles.label}>
                  Name:
                  <input
                    type="text"
                    value={selectedLink.tags.name || ""}
                    onChange={(e) =>
                      onUpdateLink(selectedLink.id, {
                        name: e.target.value || undefined,
                      })
                    }
                    className={styles.input}
                  />
                </label>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedLink.tags.oneway || false}
                    onChange={(e) =>
                      onUpdateLink(selectedLink.id, {
                        oneway: e.target.checked,
                      })
                    }
                  />
                  One-way
                </label>

                {selectedLink.isNew && (
                  <button
                    onClick={() => onDeleteLink(selectedLink.id)}
                    className={styles.deleteButton}
                  >
                    Delete Link
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}