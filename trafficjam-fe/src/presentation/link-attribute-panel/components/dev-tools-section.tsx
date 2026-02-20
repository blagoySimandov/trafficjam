import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { TrafficLink } from "../../../types";
import { AttributeField, AttributeValue } from "./attribute-field";
import styles from "../link-attribute-panel.module.css";

interface DevToolsSectionProps {
  links: TrafficLink[];
}

export function DevToolsSection({ links }: DevToolsSectionProps) {
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
          {links.length === 1 ? (
            <>
              <AttributeField label="Link ID">
                <AttributeValue value={links[0].id} />
              </AttributeField>

              <AttributeField label="From Node">
                <AttributeValue value={links[0].from} />
              </AttributeField>

              <AttributeField label="To Node">
                <AttributeValue value={links[0].to} />
              </AttributeField>
            </>
          ) : (
            <AttributeField label="Selected Links">
              <div style={{ maxHeight: "200px", overflow: "auto" }}>
                {links.map((link, idx) => (
                  <div key={link.id}>
                    {idx + 1}. {link.tags.name || link.tags.highway} (ID:{" "}
                    {link.id})
                  </div>
                ))}
              </div>
            </AttributeField>
          )}
        </div>
      )}
    </div>
  );
}
