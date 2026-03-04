import { useState, useMemo } from "react";
import { X, Ban } from "lucide-react";
import type { Network, TrafficLink } from "../../types";
import { HIGHWAY_TYPES } from "../../constants";
import { AttributeField } from "./components/attribute-field";
import { DevToolsSection } from "./components/dev-tools-section";
import { RoadTypeFieldLabel } from "./components/road-type-help";
import { useUpdateLink } from "./hooks/use-update-link";
import { LANE_OPTIONS, MAXSPEED_OPTIONS, ONEWAY_OPTIONS } from "./constants";
import styles from "./link-attribute-panel.module.css";

const MIXED_VALUE = Symbol("mixed");

interface LinkAttributePanelProps {
  links: TrafficLink[];
  network: Network | null;
  onClose: () => void;
  onSave: (updatedNetwork: Network, message: string) => void;
  onSelectAllWithSameName: (streetName: string) => void;
}

export function LinkAttributePanel({
  links,
  network,
  onClose,
  onSave,
  onSelectAllWithSameName,
}: LinkAttributePanelProps) {
  const [editedValues, setEditedValues] = useState<Partial<TrafficLink["tags"]>>({});

  const { updateLinks } = useUpdateLink(network, onSave);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const isSingleLink = links.length === 1;
  const link = links[0];
  const streetName = link.tags.name;
  const allDisabled = links.every((l) => l.disabled);
  const someDisabled = links.some((l) => l.disabled);

  const mixedState = useMemo(() => {
    if (isSingleLink) return {};

    const allNames = links.map((l) => l.tags.name);
    const allHighways = links.map((l) => l.tags.highway);
    const allLanes = links.map((l) => l.tags.lanes);
    const allMaxspeeds = links.map((l) => l.tags.maxspeed);
    const allOneways = links.map((l) => l.tags.oneway);

    const hasUniqueName = new Set(allNames).size === 1;
    const hasUniqueHighway = new Set(allHighways).size === 1;
    const hasUniqueLanes = new Set(allLanes).size === 1;
    const hasUniqueMaxspeed = new Set(allMaxspeeds).size === 1;
    const hasUniqueOneway = new Set(allOneways).size === 1;

    return {
      name: !hasUniqueName,
      highway: !hasUniqueHighway,
      lanes: !hasUniqueLanes,
      maxspeed: !hasUniqueMaxspeed,
      oneway: !hasUniqueOneway,
    };
  }, [links]);

  const getDisplayValue = (field: keyof TrafficLink["tags"]) => {
    if (field in editedValues) {
      return editedValues[field];
    }
    if (mixedState[field]) {
      return MIXED_VALUE;
    }
    return link.tags[field];
  };

  const handleHighwayChange = (value: string) => {
    if (value === "") return;
    setEditedValues({ ...editedValues, highway: value });
  };

  const handleLanesChange = (value: string) => {
    const lanes = value === "" ? undefined : parseInt(value, 10);
    setEditedValues({ ...editedValues, lanes });
  };

  const handleMaxspeedChange = (value: string) => {
    const maxspeed = value === "" ? undefined : parseInt(value, 10);
    setEditedValues({ ...editedValues, maxspeed });
  };

  const handleOnewayChange = (value: string) => {
    if (value === "") return;
    const oneway = value === "true";
    setEditedValues({ ...editedValues, oneway });
  };

  const handleNameChange = (value: string) => {
    const name = value === "" ? undefined : value;
    setEditedValues({ ...editedValues, name });
  };

  const handleSave = () => {
    const updatedLinks = links.map((l) => ({
      ...l,
      tags: {
        ...l.tags,
        ...editedValues,
      },
    }));
    updateLinks(updatedLinks);
    onClose();
  };

  const handleDisableToggle = () => {
    const nowDisabled = !allDisabled;
    const updatedLinks = links.map((l) => ({ ...l, disabled: nowDisabled }));
    updateLinks(updatedLinks);
    setShowDisableConfirm(false);
  };

  return (
    <div className={styles.linkAttributePanel}>
      <div className={styles.panelHeader}>
        <h3>{links.length === 1 ? "Link Attributes" : `${links.length} Links Selected`}</h3>
        <button
          className={styles.closeButton}
          onClick={onClose}
          title="Close panel"
        >
          <X size={18} />
        </button>
      </div>

      <div className={styles.panelContent}>
        {isSingleLink && streetName && (
          <button
            className={styles.selectAllButton}
            onClick={() => onSelectAllWithSameName(streetName)}
            type="button"
          >
            Select all links on {streetName}
          </button>
        )}
        {!isSingleLink && (
          <div className={styles.batchEditWarning}>
            Editing {links.length} links - changes will apply to all
          </div>
        )}
        <AttributeField label="Name">
          <input
            type="text"
            className={styles.attributeInput}
            value={getDisplayValue("name") === MIXED_VALUE ? "" : (getDisplayValue("name") as string) || ""}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={mixedState.name ? "Mixed values" : "Not specified"}
          />
        </AttributeField>

        <AttributeField
          label="Highway Type"
          labelSuffix={
            <RoadTypeFieldLabel
              currentHighway={
                getDisplayValue("highway") !== MIXED_VALUE
                  ? (getDisplayValue("highway") as string)
                  : undefined
              }
            />
          }
        >
          <select
            className={styles.attributeSelect}
            value={getDisplayValue("highway") === MIXED_VALUE ? "" : (getDisplayValue("highway") as string)}
            onChange={(e) => handleHighwayChange(e.target.value)}
          >
            {mixedState.highway && <option value="">Mixed values</option>}
            {HIGHWAY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </AttributeField>

        <AttributeField label="Lanes">
          <select
            className={styles.attributeSelect}
            value={
              getDisplayValue("lanes") === MIXED_VALUE
                ? ""
                : getDisplayValue("lanes")?.toString() || ""
            }
            onChange={(e) => handleLanesChange(e.target.value)}
          >
            {mixedState.lanes ? (
              <option value="">Mixed values</option>
            ) : (
              <option value="">Not specified</option>
            )}
            {LANE_OPTIONS.map((lanes) => (
              <option key={lanes} value={lanes.toString()}>
                {lanes}
              </option>
            ))}
          </select>
        </AttributeField>

        <AttributeField label="Max Speed">
          <select
            className={styles.attributeSelect}
            value={
              getDisplayValue("maxspeed") === MIXED_VALUE
                ? ""
                : getDisplayValue("maxspeed")?.toString() || ""
            }
            onChange={(e) => handleMaxspeedChange(e.target.value)}
          >
            {mixedState.maxspeed && <option value="">Mixed</option>}
            {Object.entries(MAXSPEED_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </AttributeField>

        <AttributeField label="One-way">
          <select
            className={styles.attributeSelect}
            value={
              getDisplayValue("oneway") === MIXED_VALUE
                ? ""
                : getDisplayValue("oneway")?.toString() || "false"
            }
            onChange={(e) => handleOnewayChange(e.target.value)}
          >
            {mixedState.oneway && <option value="">Mixed values</option>}
            {Object.entries(ONEWAY_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </AttributeField>

        <DevToolsSection links={links} />

        {someDisabled && !allDisabled && (
          <div className={styles.disabledMixedWarning}>
            Some selected links are disabled
          </div>
        )}

        {allDisabled && (
          <div className={styles.disabledBadge}>
            <Ban size={14} />
            Road disabled — cars will be rerouted
          </div>
        )}

        {!showDisableConfirm ? (
          <button
            className={allDisabled ? styles.enableButton : styles.disableButton}
            onClick={() => allDisabled ? handleDisableToggle() : setShowDisableConfirm(true)}
            type="button"
          >
            <Ban size={16} />
            {allDisabled
              ? (isSingleLink ? "Re-enable Road" : `Re-enable ${links.length} Roads`)
              : (isSingleLink ? "Disable Road" : `Disable ${links.length} Roads`)}
          </button>
        ) : (
          <div className={styles.confirmDialog}>
            <p className={styles.confirmText}>
              This will close {isSingleLink ? "this road segment" : `these ${links.length} road segments`} to
              car traffic. Vehicles in the simulation will be forced to find
              alternative routes, which may increase congestion elsewhere.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancel}
                onClick={() => setShowDisableConfirm(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className={styles.confirmDisable}
                onClick={handleDisableToggle}
                type="button"
              >
                Disable
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.panelFooter}>
        <button className={styles.saveButton} onClick={handleSave} type="button">
          {isSingleLink ? 'Save Changes' : `Save Changes to ${links.length} Links`}
        </button>
      </div>
    </div>
  );
}
