import { useState } from "react";
import { X } from "lucide-react";
import type { Building, Network } from "../../types";
import { BUILDING_TYPE_LABELS } from "../../constants";
import styles from "./building-attribute-panel.module.css";

const ALL_AGENT_TYPES = ["employed_adult", "non_employed_adult", "elderly", "older_child"] as const;
const AGENT_TYPE_LABELS: Record<string, string> = {
  employed_adult: "Employed adults",
  non_employed_adult: "Non-employed adults",
  elderly: "Elderly (65+)",
  older_child: "Students (12+)",
};

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
  const [startTime, setStartTime] = useState(building.hotspot?.startTime ?? "");
  const [endTime, setEndTime] = useState(building.hotspot?.endTime ?? "");
  const [agentTypes, setAgentTypes] = useState<string[]>(
    building.hotspot?.agentTypes?.length ? building.hotspot.agentTypes : [...ALL_AGENT_TYPES]
  );
  const [errors, setErrors] = useState<{
    trafficPct?: string;
    startTime?: string;
    endTime?: string;
  }>({});

  const handleSave = () => {
    if (!network) return;

    if (isHotspot) {
      const newErrors: typeof errors = {};
      const parsedTraffic = Number(trafficPct);

      const otherTotal = [...(network.buildings?.values() ?? [])]
        .filter((b) => b.id !== building.id && b.hotspot)
        .reduce((sum, b) => sum + b.hotspot!.trafficPercentage, 0);

      if (!trafficPct || isNaN(parsedTraffic) || parsedTraffic < 1 || parsedTraffic > 100)
        newErrors.trafficPct = "Must be between 1 and 100";
      else if (otherTotal + parsedTraffic > 100)
        newErrors.trafficPct = `Total hotspot % would be ${otherTotal + parsedTraffic}% — must not exceed 100%`;
      if (!startTime)
        newErrors.startTime = "Required";
      if (!endTime)
        newErrors.endTime = "Required";
      else if (startTime && endTime <= startTime)
        newErrors.endTime = "End time must be after start time";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});

      const updatedBuilding: Building = {
        ...building,
        hotspot: {
          label,
          trafficPercentage: parsedTraffic,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          agentTypes: agentTypes.length === ALL_AGENT_TYPES.length ? [] : agentTypes,
        },
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

  const toggleAgentType = (type: string) => {
    setAgentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const computedDuration = (() => {
    if (!startTime || !endTime) return null;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const diff = eh * 60 + em - (sh * 60 + sm);
    if (diff <= 0) return null;
    return `Duration: ${Math.floor(diff / 60)}h ${diff % 60}min`;
  })();

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
              <label className={styles.attributeLabel}>Time Window</label>
              <div className={styles.timeRow}>
                <div>
                  <label className={styles.attributeLabel}>Start Time</label>
                  <input
                    type="time"
                    className={styles.attributeInput}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                  {errors.startTime && (
                    <span className={styles.fieldError}>{errors.startTime}</span>
                  )}
                </div>
                <div>
                  <label className={styles.attributeLabel}>End Time</label>
                  <input
                    type="time"
                    className={styles.attributeInput}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                  {errors.endTime && (
                    <span className={styles.fieldError}>{errors.endTime}</span>
                  )}
                </div>
              </div>
              {computedDuration && (
                <span className={styles.computedDuration}>{computedDuration}</span>
              )}
            </div>

            <div className={styles.attributeSection}>
              <label className={styles.attributeLabel}>Interested Agents</label>
              <div className={styles.agentTypeGrid}>
                {ALL_AGENT_TYPES.map((type) => (
                  <label key={type} className={styles.agentTypeCheckbox}>
                    <input
                      type="checkbox"
                      checked={agentTypes.includes(type)}
                      onChange={() => toggleAgentType(type)}
                    />
                    {AGENT_TYPE_LABELS[type]}
                  </label>
                ))}
              </div>
              {agentTypes.length === ALL_AGENT_TYPES.length && (
                <span className={styles.fieldHint}>Applies to all agent types</span>
              )}
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
