import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { TrafficLink } from "../../../types";
import { AttributeField, AttributeValue } from "./attribute-field";
import styles from "../link-attribute-panel.module.css";

interface DevToolsSectionProps {
  link: TrafficLink;
}

export function DevToolsSection({ link }: DevToolsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.devToolsSection}>
      <button
        className={styles.devToolsToggle}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span>Advanced Info</span>
      </button>

      {isOpen && (
        <div className={styles.devToolsContent}>
          <AttributeField label="Link ID">
            <AttributeValue value={link.id} />
          </AttributeField>

          <AttributeField label="OSM ID">
            <AttributeValue value={link.osmId} />
          </AttributeField>

          <AttributeField label="From Node">
            <AttributeValue value={link.from} />
          </AttributeField>

          <AttributeField label="To Node">
            <AttributeValue value={link.to} />
          </AttributeField>
        </div>
      )}
    </div>
  );
}
