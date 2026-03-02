import { useState } from "react";
import { X } from "lucide-react";
import type { Building, BuildingHotspot, Network } from "../../types";
import { BUILDING_TYPE_LABELS } from "../../constants";
import styles from "./building-attribute-panel.module.css";

interface BuildingAttributePanelProps {
  building: Building;
  network: Network | null;
  onClose: () => void;
  onSave: (updatedNetwork: Network, message: string) => void;
}

export function BuildingAttributePanel({
  building,
  network,
  onClose,
  onSave,
}: BuildingAttributePanelProps) {
  const [isHotspot, setIsHotspot] = useState(!!building.hotspot);
  const [hotspot, setHotspot] = useState<BuildingHotspot>(
    building.hotspot ?? { label: "", trafficPercentage: 10, dwellTimeMinutes: 60 }
  );

  const handleSave = () => {
    if (!network) return;
    const updatedBuilding: Building = {
      ...building,
      hotspot: isHotspot ? hotspot : undefined,
    };
    const updatedBuildings = new Map(network.buildings);
    updatedBuildings.set(building.id, updatedBuilding);
    onSave({ ...network, buildings: updatedBuildings }, "Updated building hotspot");
    onClose();
  };

  const buildingName = building.tags.name ?? BUILDING_TYPE_LABELS[building.type];
  const typeLabel = BUILDING_TYPE_LABELS[building.type];

  return (
    <div className={styles.buildingAttributePanel}>
      <div className={styles.panelHeader}>
        <h3>
          {buildingName}
          {building.tags.name && <span className={styles.buildingType}>{typeLabel}</span>}
        </h3>
        <button className={styles.closeButton} onClick={onClose} title="Close panel">
          <X size={18} />
        </button>
      </div>

      <div className={styles.panelContent}>
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={isHotspot}
            onChange={(e) => setIsHotspot(e.target.checked)}
          />
          Mark as Hotspot
        </label>

        {isHotspot && (
          <div className={styles.hotspotFields}>
            <div className={styles.attributeSection}>
              <label className={styles.attributeLabel}>Label</label>
              <input
                type="text"
                className={styles.attributeInput}
                value={hotspot.label}
                onChange={(e) => setHotspot({ ...hotspot, label: e.target.value })}
                placeholder="e.g. Concert, Shopping Event"
              />
            </div>
            <div className={styles.attributeSection}>
              <label className={styles.attributeLabel}>Traffic % (1–100)</label>
              <input
                type="number"
                className={styles.attributeInput}
                min={1}
                max={100}
                value={hotspot.trafficPercentage}
                onChange={(e) =>
                  setHotspot({ ...hotspot, trafficPercentage: Number(e.target.value) })
                }
              />
            </div>
            <div className={styles.attributeSection}>
              <label className={styles.attributeLabel}>Dwell Time (minutes)</label>
              <input
                type="number"
                className={styles.attributeInput}
                min={5}
                value={hotspot.dwellTimeMinutes}
                onChange={(e) =>
                  setHotspot({ ...hotspot, dwellTimeMinutes: Number(e.target.value) })
                }
              />
            </div>
          </div>
        )}
      </div>

      <div className={styles.panelFooter}>
        <button className={styles.saveButton} onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
