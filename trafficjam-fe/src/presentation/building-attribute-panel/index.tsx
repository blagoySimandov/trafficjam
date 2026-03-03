import { useState } from "react";
import { X } from "lucide-react";
import type { Building, Network } from "../../types";
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
  const [label, setLabel] = useState(building.hotspot?.label ?? "");
  const [trafficPct, setTrafficPct] = useState(
    String(building.hotspot?.trafficPercentage ?? 10)
  );
  const [dwellTime, setDwellTime] = useState(
    String(building.hotspot?.dwellTimeMinutes ?? 60)
  );
  const [errors, setErrors] = useState<{ trafficPct?: string; dwellTime?: string }>({});

  const handleSave = () => {
    if (!network) return;

    if (isHotspot) {
      const newErrors: typeof errors = {};
      const parsedTraffic = Number(trafficPct);
      const parsedDwell = Number(dwellTime);

      if (!trafficPct || isNaN(parsedTraffic) || parsedTraffic < 1 || parsedTraffic > 100)
        newErrors.trafficPct = "Must be between 1 and 100";
      if (!dwellTime || isNaN(parsedDwell) || parsedDwell < 5)
        newErrors.dwellTime = "Must be at least 5 minutes";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});

      const updatedBuilding: Building = {
        ...building,
        hotspot: { label, trafficPercentage: parsedTraffic, dwellTimeMinutes: parsedDwell },
      };
      const updatedBuildings = new Map(network.buildings);
      updatedBuildings.set(building.id, updatedBuilding);
      onSave({ ...network, buildings: updatedBuildings }, "Updated building hotspot");
      onClose();
      return;
    }

    const updatedBuilding: Building = { ...building, hotspot: undefined };
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
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Concert, Shopping Event"
              />
            </div>
            <div className={styles.attributeSection}>
              <label className={styles.attributeLabel}>Traffic % (1–100)</label>
              <input
                type="text"
                inputMode="numeric"
                className={styles.attributeInput}
                value={trafficPct}
                onChange={(e) => setTrafficPct(e.target.value.replace(/[^0-9]/g, ""))}
              />
              {errors.trafficPct && (
                <span className={styles.fieldError}>{errors.trafficPct}</span>
              )}
            </div>
            <div className={styles.attributeSection}>
              <label className={styles.attributeLabel}>Dwell Time (minutes)</label>
              <input
                type="text"
                inputMode="numeric"
                className={styles.attributeInput}
                value={dwellTime}
                onChange={(e) => setDwellTime(e.target.value.replace(/[^0-9]/g, ""))}
              />
              {errors.dwellTime && (
                <span className={styles.fieldError}>{errors.dwellTime}</span>
              )}
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
