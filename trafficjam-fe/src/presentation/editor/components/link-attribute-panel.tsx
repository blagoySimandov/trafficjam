import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronRight, Layers } from "lucide-react";
import type { TrafficLink } from "../../../types";

interface LinkAttributePanelProps {
  links: TrafficLink[];
  onClose: () => void;
  onSave: (updatedLinks: TrafficLink[]) => void;
  onSelectByName: (name: string) => void;
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

const MIXED_VALUE = "__MIXED__";

// Helper to determine if all links have the same value for a given attribute
function getCommonValue<T>(
  links: TrafficLink[],
  getter: (link: TrafficLink) => T | undefined,
): T | typeof MIXED_VALUE | undefined {
  if (links.length === 0) return undefined;
  const firstValue = getter(links[0]);
  const allSame = links.every((link) => getter(link) === firstValue);
  return allSame ? firstValue : MIXED_VALUE;
}

export function LinkAttributePanel({
  links,
  onClose,
  onSave,
  onSelectByName,
}: LinkAttributePanelProps) {
  const [editedValues, setEditedValues] = useState({
    name: getCommonValue(links, (l) => l.tags.name),
    highway: getCommonValue(links, (l) => l.tags.highway),
    lanes: getCommonValue(links, (l) => l.tags.lanes),
    maxspeed: getCommonValue(links, (l) => l.tags.maxspeed),
    oneway: getCommonValue(links, (l) => l.tags.oneway),
  });
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  // Update local state when the links prop changes
  useEffect(() => {
    setEditedValues({
      name: getCommonValue(links, (l) => l.tags.name),
      highway: getCommonValue(links, (l) => l.tags.highway),
      lanes: getCommonValue(links, (l) => l.tags.lanes),
      maxspeed: getCommonValue(links, (l) => l.tags.maxspeed),
      oneway: getCommonValue(links, (l) => l.tags.oneway),
    });
  }, [links]);

  const handleHighwayChange = (value: string) => {
    setEditedValues((prev) => ({ ...prev, highway: value }));
  };

  const handleLanesChange = (value: string) => {
    const lanes = value === "" ? undefined : parseInt(value, 10);
    setEditedValues((prev) => ({ ...prev, lanes }));
  };

  const handleMaxspeedChange = (value: string) => {
    const maxspeed = value === "" ? undefined : parseInt(value, 10);
    setEditedValues((prev) => ({ ...prev, maxspeed }));
  };

  const handleOnewayChange = (value: string) => {
    const oneway = value === "true";
    setEditedValues((prev) => ({ ...prev, oneway }));
  };

  const handleNameChange = (value: string) => {
    setEditedValues((prev) => ({
      ...prev,
      name: value === "" ? undefined : value,
    }));
  };

  const handleSelectByNameClick = () => {
    const nameValue = editedValues.name;
    if (nameValue && nameValue !== MIXED_VALUE) {
      onSelectByName(nameValue);
    }
  };

  const handleSave = () => {
    // Apply edited values to all selected links
    const updatedLinks = links.map((link) => ({
      ...link,
      tags: {
        ...link.tags,
        name:
          editedValues.name === MIXED_VALUE
            ? link.tags.name
            : editedValues.name,
        highway:
          editedValues.highway === MIXED_VALUE
            ? link.tags.highway
            : (editedValues.highway as string),
        lanes:
          editedValues.lanes === MIXED_VALUE
            ? link.tags.lanes
            : editedValues.lanes,
        maxspeed:
          editedValues.maxspeed === MIXED_VALUE
            ? link.tags.maxspeed
            : editedValues.maxspeed,
        oneway:
          editedValues.oneway === MIXED_VALUE
            ? link.tags.oneway
            : editedValues.oneway,
      },
    }));

    onSave(updatedLinks);
    onClose();
  };

  return (
    <div className="link-attribute-panel">
      <div className="panel-header">
        <h3>
          {links.length === 1
            ? "Link Attributes"
            : `Link Attributes (${links.length} selected)`}
        </h3>
        <button className="close-button" onClick={onClose} title="Close panel">
          <X size={18} />
        </button>
      </div>

      <div className="panel-content">
        <div className="attribute-section">
          <label className="attribute-label">Name</label>
          <div className="name-input-container">
            <input
              type="text"
              className="attribute-input"
              value={
                editedValues.name === MIXED_VALUE ? "" : editedValues.name || ""
              }
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={
                editedValues.name === MIXED_VALUE ? "Mixed" : "Not specified"
              }
            />
            {editedValues.name &&
              editedValues.name !== MIXED_VALUE &&
              links.length === 1 && (
                <button
                  className="select-by-name-button"
                  onClick={handleSelectByNameClick}
                  title="Select all links with this name"
                >
                  <Layers size={16} />
                </button>
              )}
          </div>
        </div>

        <div className="attribute-section">
          <label className="attribute-label">Highway Type</label>
          <select
            className="attribute-select"
            value={
              editedValues.highway === MIXED_VALUE
                ? ""
                : (editedValues.highway as string) || ""
            }
            onChange={(e) => handleHighwayChange(e.target.value)}
          >
            {editedValues.highway === MIXED_VALUE && (
              <option value="">Mixed</option>
            )}
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
            value={
              editedValues.lanes === MIXED_VALUE
                ? ""
                : editedValues.lanes?.toString() || ""
            }
            onChange={(e) => handleLanesChange(e.target.value)}
          >
            {editedValues.lanes === MIXED_VALUE ? (
              <option value="">Mixed</option>
            ) : (
              <option value="">Not specified</option>
            )}
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
            value={
              editedValues.maxspeed === MIXED_VALUE
                ? ""
                : editedValues.maxspeed?.toString() || ""
            }
            onChange={(e) => handleMaxspeedChange(e.target.value)}
          >
            {editedValues.maxspeed === MIXED_VALUE ? (
              <option value="">Mixed</option>
            ) : (
              <option value="">Not specified</option>
            )}
            {MAXSPEED_OPTIONS.filter((opt) => opt.value !== "").map(
              (option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="attribute-section">
          <label className="attribute-label">One-way</label>
          <select
            className="attribute-select"
            value={
              editedValues.oneway === MIXED_VALUE
                ? ""
                : editedValues.oneway
                  ? "true"
                  : "false"
            }
            onChange={(e) => handleOnewayChange(e.target.value)}
          >
            {editedValues.oneway === MIXED_VALUE && (
              <option value="">Mixed</option>
            )}
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
              {links.length === 1 ? (
                <>
                  <div className="attribute-section">
                    <label className="attribute-label">Link ID</label>
                    <div className="attribute-value readonly">
                      {links[0].id}
                    </div>
                  </div>

                  <div className="attribute-section">
                    <label className="attribute-label">From Node</label>
                    <div className="attribute-value readonly">
                      {links[0].from}
                    </div>
                  </div>

                  <div className="attribute-section">
                    <label className="attribute-label">To Node</label>
                    <div className="attribute-value readonly">
                      {links[0].to}
                    </div>
                  </div>
                </>
              ) : (
                <div className="attribute-section">
                  <label className="attribute-label">Selected Links</label>
                  <div
                    className="attribute-value readonly"
                    style={{ maxHeight: "200px", overflow: "auto" }}
                  >
                    {links.map((link, idx) => (
                      <div key={link.id}>
                        {idx + 1}. {link.tags.name || link.tags.highway} (ID:{" "}
                        {link.id})
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
