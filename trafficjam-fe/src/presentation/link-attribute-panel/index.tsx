import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Network, TrafficLink } from "../../types";
import { HIGHWAY_TYPES } from "../../constants";
import { AttributeField } from "./components/attribute-field";
import { DevToolsSection } from "./components/dev-tools-section";
import { useUpdateLink } from "./hooks/use-update-link";
import { LANE_OPTIONS, MAXSPEED_OPTIONS, ONEWAY_OPTIONS } from "./constants";
import styles from "./link-attribute-panel.module.css";

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
  const [editedLink, setEditedLink] = useState<TrafficLink>(links[0]);
  const { updateLinks } = useUpdateLink(network, onSave);
  const isSingleLink = links.length === 1;
  const link = links[0];
  const streetName = link.tags.name;

  // Update local state when the link prop changes
  useEffect(() => {
    setEditedLink(links[0]);
  }, [links]);

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
    const updatedLinks = isSingleLink
      ? [editedLink]
      : links.map((link) => ({
          ...link,
          tags: {
            ...link.tags,
            ...editedLink.tags,
          },
        }));
    updateLinks(updatedLinks);
    onClose();
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

        <DevToolsSection links={links} />
      </div>

      <div className={styles.panelFooter}>
        <button className={styles.saveButton} onClick={handleSave}>
          {isSingleLink ? 'Save Changes' : `Save Changes to ${links.length} Links`}
        </button>
      </div>
    </div>
  );
}
