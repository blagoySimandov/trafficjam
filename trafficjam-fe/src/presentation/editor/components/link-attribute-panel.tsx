import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import type { TrafficLink } from "../../../types";

interface LinkAttributePanelProps {
  link: TrafficLink;
  onClose: () => void;
  onSave: (updatedLink: TrafficLink) => void;
}

const HIGHWAY_TYPES = [
  "motorway",
  "motorway_link",
  "trunk",
  "trunk_link",
  "primary",
  "primary_link",
  "secondary",
  "secondary_link",
  "tertiary",
  "tertiary_link",
  "residential",
  "service",
  "unclassified",
  "living_street",
  "pedestrian",
  "track",
  "cycleway",
  "footway",
  "path",
];

const LANE_OPTIONS = [1, 2, 3, 4, 5, 6];

const MAXSPEED_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "20", label: "20 km/h" },
  { value: "30", label: "30 km/h" },
  { value: "40", label: "40 km/h" },
  { value: "50", label: "50 km/h" },
  { value: "60", label: "60 km/h" },
  { value: "70", label: "70 km/h" },
  { value: "80", label: "80 km/h" },
  { value: "90", label: "90 km/h" },
  { value: "100", label: "100 km/h" },
  { value: "110", label: "110 km/h" },
  { value: "120", label: "120 km/h" },
  { value: "130", label: "130 km/h" },
];

const ONEWAY_OPTIONS = [
  { value: "false", label: "No" },
  { value: "true", label: "Yes" },
];

export function LinkAttributePanel({
  link,
  onClose,
  onSave,
}: LinkAttributePanelProps) {
  const [editedLink, setEditedLink] = useState<TrafficLink>(link);
  const [devToolsOpen, setDevToolsOpen] = useState(false);

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
    <div className="link-attribute-panel">
      <div className="panel-header">
        <h3>Link Attributes</h3>
        <button className="close-button" onClick={onClose} title="Close panel">
          <X size={18} />
        </button>
      </div>

      <div className="panel-content">
        <div className="attribute-section">
          <label className="attribute-label">Name</label>
          <input
            type="text"
            className="attribute-input"
            value={editedLink.tags.name || ""}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Not specified"
          />
        </div>

        <div className="attribute-section">
          <label className="attribute-label">Highway Type</label>
          <select
            className="attribute-select"
            value={editedLink.tags.highway}
            onChange={(e) => handleHighwayChange(e.target.value)}
          >
            {HIGHWAY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="attribute-section">
          <label className="attribute-label">Lanes</label>
          <select
            className="attribute-select"
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
        </div>

        <div className="attribute-section">
          <label className="attribute-label">Max Speed</label>
          <select
            className="attribute-select"
            value={editedLink.tags.maxspeed?.toString() || ""}
            onChange={(e) => handleMaxspeedChange(e.target.value)}
          >
            {MAXSPEED_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="attribute-section">
          <label className="attribute-label">One-way</label>
          <select
            className="attribute-select"
            value={editedLink.tags.oneway ? "true" : "false"}
            onChange={(e) => handleOnewayChange(e.target.value)}
          >
            {ONEWAY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="dev-tools-section">
          <button
            className="dev-tools-toggle"
            onClick={() => setDevToolsOpen(!devToolsOpen)}
            type="button"
          >
            {devToolsOpen ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
            <span>Advanced Info</span>
          </button>

          {devToolsOpen && (
            <div className="dev-tools-content">
              <div className="attribute-section">
                <label className="attribute-label">Link ID</label>
                <div className="attribute-value readonly">{link.id}</div>
              </div>

              <div className="attribute-section">
                <label className="attribute-label">OSM ID</label>
                <div className="attribute-value readonly">{link.osmId}</div>
              </div>

              <div className="attribute-section">
                <label className="attribute-label">From Node</label>
                <div className="attribute-value readonly">{link.from}</div>
              </div>

              <div className="attribute-section">
                <label className="attribute-label">To Node</label>
                <div className="attribute-value readonly">{link.to}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="panel-footer">
        <button className="save-button" onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
