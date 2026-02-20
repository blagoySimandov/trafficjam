import { useState } from "react";
import type { TrafficLink } from "../../../types";
import { getCommonValue } from "../helpers";
import { MIXED_VALUE } from "../constants";

export function useLinkForm(links: TrafficLink[]) {
  const getInitialValues = () => ({
    name: getCommonValue(links, (l) => l.tags.name),
    highway: getCommonValue(links, (l) => l.tags.highway),
    lanes: getCommonValue(links, (l) => l.tags.lanes),
    maxspeed: getCommonValue(links, (l) => l.tags.maxspeed),
    oneway: getCommonValue(links, (l) => l.tags.oneway),
  });

  const currentLinkIds = links.map((l) => l.id).sort().join(",");
  const [trackedLinkIds, setTrackedLinkIds] = useState(currentLinkIds);
  const [editedValues, setEditedValues] = useState(getInitialValues);

  if (trackedLinkIds !== currentLinkIds) {
    setTrackedLinkIds(currentLinkIds);
    setEditedValues(getInitialValues());
  }

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

  const applyEditsToLinks = (): TrafficLink[] => {
    return links.map((link) => ({
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
  };

  return {
    editedValues,
    handlers: {
      handleNameChange,
      handleHighwayChange,
      handleLanesChange,
      handleMaxspeedChange,
      handleOnewayChange,
    },
    applyEditsToLinks,
  };
}
