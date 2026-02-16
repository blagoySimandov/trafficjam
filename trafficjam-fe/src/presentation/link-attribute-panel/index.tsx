import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { TrafficLink } from "../../types";
import { HIGHWAY_TYPES } from "../../constants";
import { AttributeField } from "./components/attribute-field";
import { DevToolsSection } from "./components/dev-tools-section";
import { LANE_OPTIONS, MAXSPEED_OPTIONS, ONEWAY_OPTIONS } from "./constants";
import styles from "./link-attribute-panel.module.css";

interface LinkAttributePanelProps {
  link: TrafficLink;
  onClose: () => void;
  onSave: (updatedLink: TrafficLink) => void;
}

export function LinkAttributePanel({
  link,
  onClose,
  onSave,
}: LinkAttributePanelProps) {
  const [editedLink, setEditedLink] = useState<TrafficLink>(link);

  // Update local state when the link prop changes
  useEffect(() => {
    setEditedLink(link);
  }, [link]);

  const handleHighwayChange = (value: string) => {
    setEditedLink({
      ...editedLink,
      tags: {
        ...editedLink.tags,
        highway: value,
      },
    });
  };

  const handleLanesChange = (value: string) => {
    const lanes = value === "" ? undefined : parseInt(value, 10);
    setEditedLink({
      ...editedLink,
      tags: {
        ...editedLink.tags,
        lanes,
      },
    });
  };

  const handleMaxspeedChange = (value: string) => {
    const maxspeed = value === "" ? undefined : parseInt(value, 10);
    setEditedLink({
      ...editedLink,
      tags: {
        ...editedLink.tags,
        maxspeed,
      },
    });
  };

  const handleOnewayChange = (value: string) => {
    const oneway = value === "true";
    setEditedLink({
      ...editedLink,
      tags: {
        ...editedLink.tags,
        oneway,
      },
    });
  };

  const handleNameChange = (value: string) => {
    setEditedLink({
      ...editedLink,
      tags: {
        ...editedLink.tags,
        name: value === "" ? undefined : value,
      },
    });
  };

  const handleSave = () => {
    onSave(editedLink);
    onClose();
  };

  return (
    <div className={styles.linkAttributePanel}>
      <div className={styles.panelHeader}>
        <h3>Link Attributes</h3>
        <button
          className={styles.closeButton}
          onClick={onClose}
          title="Close panel"
        >
          <X size={18} />
        </button>
      </div>

      <div className={styles.panelContent}>
        <AttributeField label="Name">
          <input
            type="text"
            className={styles.attributeInput}
            value={editedLink.tags.name || ""}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Not specified"
          />
        </AttributeField>

        <AttributeField label="Highway Type">
          <select
            className={styles.attributeSelect}
            value={editedLink.tags.highway}
            onChange={(e) => handleHighwayChange(e.target.value)}
          >
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
            value={editedLink.tags.lanes?.toString() || ""}
            onChange={(e) => handleLanesChange(e.target.value)}
          >
            <option value="">Not specified</option>
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
            value={editedLink.tags.maxspeed?.toString() || ""}
            onChange={(e) => handleMaxspeedChange(e.target.value)}
          >
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
            value={editedLink.tags.oneway ? "true" : "false"}
            onChange={(e) => handleOnewayChange(e.target.value)}
          >
            {Object.entries(ONEWAY_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </AttributeField>

        <DevToolsSection link={link} />
      </div>

      <div className={styles.panelFooter}>
        <button className={styles.saveButton} onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
