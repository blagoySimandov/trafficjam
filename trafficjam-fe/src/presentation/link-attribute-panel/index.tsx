import { X } from "lucide-react";
import type { TrafficLink } from "../../types";
import { DevToolsSection } from "./components/dev-tools-section";
import {
  NameField,
  HighwayField,
  LanesField,
  MaxspeedField,
  OnewayField,
} from "./components/form-fields";
import { useLinkForm } from "./hooks/use-link-form";
import { MIXED_VALUE } from "./constants";
import styles from "./link-attribute-panel.module.css";

interface LinkAttributePanelProps {
  links: TrafficLink[];
  onClose: () => void;
  onSave: (updatedLinks: TrafficLink[]) => void;
  onSelectByName: (name: string) => void;
}

export function LinkAttributePanel({
  links,
  onClose,
  onSave,
  onSelectByName,
}: LinkAttributePanelProps) {
  const { editedValues, handlers, applyEditsToLinks } = useLinkForm(links);

  const handleSelectByNameClick = () => {
    const nameValue = editedValues.name;
    if (nameValue && nameValue !== MIXED_VALUE) {
      onSelectByName(nameValue);
    }
  };

  const handleSave = () => {
    onSave(applyEditsToLinks());
    onClose();
  };

  return (
    <div className={styles.linkAttributePanel}>
      <div className={styles.panelHeader}>
        <h3>
          {links.length === 1
            ? "Link Attributes"
            : `Link Attributes (${links.length} selected)`}
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
        <NameField
          value={editedValues.name}
          onChange={handlers.handleNameChange}
          onSelectByName={handleSelectByNameClick}
          showSelectButton={links.length === 1}
        />

        <HighwayField
          value={editedValues.highway}
          onChange={handlers.handleHighwayChange}
        />

        <LanesField
          value={editedValues.lanes}
          onChange={handlers.handleLanesChange}
        />

        <MaxspeedField
          value={editedValues.maxspeed}
          onChange={handlers.handleMaxspeedChange}
        />

        <OnewayField
          value={editedValues.oneway}
          onChange={handlers.handleOnewayChange}
        />

        <DevToolsSection links={links} />
      </div>

      <div className={styles.panelFooter}>
        <button className={styles.saveButton} onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
