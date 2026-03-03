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

const FREESPEED_STEPS = [
  {
    num: 1,
    body: (
      <>
        <strong>OSM maxspeed tag present?</strong> If <code>maxspeed=*</code> is explicitly set in
        OSM, MATSim uses that value directly as freespeed. mph values are automatically converted
        to km/h.
      </>
    ),
  },
  {
    num: 2,
    body: (
      <>
        <strong>Walk-only links</strong> fall back to <strong>4 km/h</strong> (1.111 m/s), except
        for steps which use <strong>2 km/h</strong> (0.556 m/s).
      </>
    ),
  },
  {
    num: 3,
    body: (
      <>
        <strong>Bike or bike+walk links</strong> (without a car mode) default to{" "}
        <strong>15 km/h</strong> (4.167 m/s).
      </>
    ),
  },
  {
    num: 4,
    body: (
      <>
        <strong>All other links</strong> fall back to a default speed based on their road type
        — so a motorway_link gets a lower default than a motorway, reflecting the slower
        design speed of on/off-ramps. These defaults are baked into the network at conversion
        time and are what MATSim reads directly as the freespeed for each link.
      </>
    ),
  },
  {
    num: 5,
    body: (
      <>
        <strong>Freespeed ≠ Speed limit.</strong> Freespeed is the uncongested travel speed on an
        unimpeded link. In MATSim, agents travel close to freespeed unless flow capacity is
        exceeded, at which point vehicles are queued and travel time increases.
      </>
    ),
  },
];

function FreespeedSection() {
  return (
    <div className={styles.rtFreespeedSection}>
      <div className={styles.rtSectionLabel}>How freespeed is determined</div>
      <div className={styles.rtSteps}>
        {FREESPEED_STEPS.map(({ num, body }) => (
          <div key={num} className={styles.rtStep}>
            <div className={styles.rtStepNum}>{num}</div>
            <div className={styles.rtStepText}>{body}</div>
          </div>
        ))}
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
      <FreespeedSection />
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
