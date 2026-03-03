import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Dialog } from "../../../components/dialog/dialog";
import { Tooltip } from "../../../components/tooltip/tooltip";
import { ROAD_TYPE_INFO, type RoadTypeInfo } from "../constants";
import styles from "../link-attribute-panel.module.css";

type RoadTypeCardProps = {
  typeKey: string;
  info: RoadTypeInfo;
  isActive: boolean;
  onSelect: () => void;
};

function RoadTypeCard({ typeKey, info, isActive, onSelect }: RoadTypeCardProps) {
  return (
    <button
      className={`${styles.rtCard} ${isActive ? styles.rtCardActive : ""}`}
      style={{ "--rt-color": info.color } as React.CSSProperties}
      onClick={onSelect}
      type="button"
    >
      <div className={styles.rtCardTop}>
        <span className={styles.rtCardName}>{typeKey.replace(/_/g, " ")}</span>
        <span className={styles.rtCardBadge}>{info.freespeed}</span>
      </div>
      <p className={styles.rtCardDesc}>{info.description}</p>
      <div className={styles.rtCardModes}>{info.modes}</div>
    </button>
  );
}

function SpeedBar({ pct }: { pct: number }) {
  return (
    <div className={styles.rtSpeedTrack}>
      <div className={styles.rtSpeedFill} style={{ width: `${pct}%` }} />
    </div>
  );
}

function RoadTypeDetail({ typeKey, info }: { typeKey: string; info: RoadTypeInfo }) {
  return (
    <div className={styles.rtDetail} style={{ "--rt-color": info.color } as React.CSSProperties}>
      <div className={styles.rtDetailHeader}>
        <span className={styles.rtDetailDot} />
        <span className={styles.rtDetailTitle}>{typeKey.replace(/_/g, " ")}</span>
      </div>
      <div className={styles.rtDetailGrid}>
        <div>
          <div className={styles.rtDetailLabel}>Freespeed</div>
          <strong>{info.freespeed}</strong>
          <SpeedBar pct={info.freespeedPct} />
        </div>
        <div>
          <div className={styles.rtDetailLabel}>Modes</div>
          <span>{info.modes}</span>
        </div>
        <div>
          <div className={styles.rtDetailLabel}>Capacity</div>
          <span>{info.capacity}</span>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <div className={styles.rtDetailLabel}>Notes</div>
          <span>{info.notes}</span>
        </div>
      </div>
    </div>
  );
}

function RoadTypeHelpContent() {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const entries = Object.entries(ROAD_TYPE_INFO) as [string, RoadTypeInfo][];

  const handleSelect = (key: string) =>
    setActiveKey((prev) => (prev === key ? null : key));

  return (
    <div>
      <p className={styles.rtIntro}>
        Each link's <code>roadType</code> comes from the OSM <code>highway=*</code> tag and sets
        default freespeed, capacity, and allowed transport modes. Click a card for details.
      </p>
      <div className={styles.rtGrid}>
        {entries.map(([key, info]) => (
          <RoadTypeCard
            key={key}
            typeKey={key}
            info={info}
            isActive={activeKey === key}
            onSelect={() => handleSelect(key)}
          />
        ))}
      </div>
      {activeKey && ROAD_TYPE_INFO[activeKey] && (
        <RoadTypeDetail typeKey={activeKey} info={ROAD_TYPE_INFO[activeKey]!} />
      )}
    </div>
  );
}

export function RoadTypeHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="🛣️ Road Type Reference" onClose={onClose} maxWidth={780}>
      <RoadTypeHelpContent />
    </Dialog>
  );
}

export function RoadTypeFieldLabel({ currentHighway }: { currentHighway?: string }) {
  const [showModal, setShowModal] = useState(false);
  const info = currentHighway ? ROAD_TYPE_INFO[currentHighway] : undefined;

  const tooltipText = info
    ? `${info.description} Freespeed: ${info.freespeed}. Modes: ${info.modes}.`
    : "Derived from OSM highway=* tag. Sets default freespeed, capacity, and allowed modes.";

  return (
    <>
      <div className={styles.rtLabelActions}>
        <Tooltip text={tooltipText} />
        <button
          className={styles.rtHelpButton}
          onClick={() => setShowModal(true)}
          type="button"
          title="Open road type reference"
        >
          <BookOpen size={13} />
        </button>
      </div>
      {showModal && <RoadTypeHelpModal onClose={() => setShowModal(false)} />}
    </>
  );
}
