import { useState } from "react";
import { X } from "lucide-react";
import type { Building, Network } from "../../types";
import { BUILDING_TYPE_LABELS } from "../../constants";
import styles from "./building-attribute-panel.module.css";
import { ALL_AGENT_TYPES } from "./constants";
import type { HotspotFormState, FormErrors } from "./types";
import { initHotspotState, validateHotspot } from "./utils";
import { HotspotFields } from "./components";

export interface BuildingAttributePanelProps {
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
  const [form, setForm] = useState<HotspotFormState>(() =>
    initHotspotState(building),
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const patchForm = (patch: Partial<HotspotFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleSave = () => {
    if (!network) return;

    if (isHotspot) {
      const otherTotal = [...(network.buildings?.values() ?? [])]
        .filter((b) => b.id !== building.id && b.hotspot)
        .reduce((sum, b) => sum + b.hotspot!.trafficPercentage, 0);

      const newErrors = validateHotspot(form, otherTotal);
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
    }

    const updatedBuilding: Building = isHotspot
      ? {
          ...building,
          hotspot: {
            label: form.label,
            trafficPercentage: Number(form.trafficPct),
            startTime: form.startTime || undefined,
            endTime: form.endTime || undefined,
            agentTypes:
              form.agentTypes.length === ALL_AGENT_TYPES.length
                ? []
                : form.agentTypes,
          },
        }
      : { ...building, hotspot: undefined };

    const updatedBuildings = new Map(network.buildings);
    updatedBuildings.set(building.id, updatedBuilding);
    onSave(
      { ...network, buildings: updatedBuildings },
      "Updated building hotspot",
    );
    onClose();
  };

  const buildingName =
    building.tags.name ?? BUILDING_TYPE_LABELS[building.type];
  const typeLabel = BUILDING_TYPE_LABELS[building.type];

  return (
    <div className={styles.buildingAttributePanel}>
      <div className={styles.panelHeader}>
        <h3>
          {buildingName}
          {building.tags.name && (
            <span className={styles.buildingType}>{typeLabel}</span>
          )}
        </h3>
        <button
          className={styles.closeButton}
          onClick={onClose}
          title="Close panel"
        >
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
          <HotspotFields state={form} errors={errors} onChange={patchForm} />
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
