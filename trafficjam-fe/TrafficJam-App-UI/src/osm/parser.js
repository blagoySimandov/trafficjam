import {
  BUILDING_TAG_MAPPINGS,
  ID_PREFIXES,
  OSM_TAG_VALUES,
  GEOMETRY_VALIDATION,
} from "./constants";

function isOSMNode(el) {
  return el.type === OSM_TAG_VALUES.TYPE_NODE;
}

function isOSMWay(el) {
  return el.type === OSM_TAG_VALUES.TYPE_WAY;
}

function isOSMRelation(el) {
  return el.type === OSM_TAG_VALUES.TYPE_RELATION;
}

function indexNodes(elements) {
  const osmNodes = new Map();
  for (const el of elements) {
    if (isOSMNode(el)) {
      osmNodes.set(el.id, el);
    }
  }
  return osmNodes;
}

function indexWays(elements) {
  const osmWays = new Map();
  for (const el of elements) {
    if (isOSMWay(el)) {
      osmWays.set(el.id, el);
    }
  }
  return osmWays;
}

function countNodeUsage(elements) {
  const nodeUsage = new Map();
  for (const el of elements) {
    if (isOSMWay(el) && el.tags?.highway) {
      for (const nodeId of el.nodes) {
        nodeUsage.set(nodeId, (nodeUsage.get(nodeId) || 0) + 1);
      }
    }
  }
  return nodeUsage;
}

function buildGeometry(wayNodes, osmNodes) {
  const geometry = [];
  for (const nodeId of wayNodes) {
    const osmNode = osmNodes.get(nodeId);
    if (osmNode) {
      geometry.push([osmNode.lat, osmNode.lon]);
    }
  }
  return geometry;
}

function createLink(way, geometry) {
  const fromNodeId = `${ID_PREFIXES.NODE}${way.nodes[0]}`;
  const toNodeId = `${ID_PREFIXES.NODE}${way.nodes[way.nodes.length - 1]}`;

  return {
    id: `${ID_PREFIXES.LINK}${way.id}`,
    osmId: way.id,
    from: fromNodeId,
    to: toNodeId,
    geometry,
    tags: {
      highway: way.tags.highway,
      lanes: way.tags.lanes ? parseInt(way.tags.lanes) : undefined,
      maxspeed: way.tags.maxspeed ? parseInt(way.tags.maxspeed) : undefined,
      oneway: way.tags.oneway === OSM_TAG_VALUES.ONEWAY_YES,
      name: way.tags.name,
    },
  };
}

function createNode(osmId, osmNode, connectionCount) {
  return {
    id: `${ID_PREFIXES.NODE}${osmId}`,
    osmId,
    position: [osmNode.lat, osmNode.lon],
    connectionCount,
  };
}

function createTransportRoute(relationId, wayId, geometry, tags) {
  return {
    id: `${ID_PREFIXES.TRANSPORT}${relationId}${ID_PREFIXES.TRANSPORT_WAY}${wayId}`,
    osmId: relationId,
    wayId,
    geometry,
    tags: {
      route: tags.route,
      ref: tags.ref,
      name: tags.name,
      network: tags.network,
      operator: tags.operator,
      colour: tags.colour,
    },
  };
}

function determineBuildingType(tags) {
  for (const mapping of BUILDING_TAG_MAPPINGS) {
    if (tags[mapping.tag] === mapping.value) {
      return mapping.type;
    }
  }
  return null;
}

function createBuilding(osmId, position, tags, geometry) {
  const type = determineBuildingType(tags);
  if (!type) return null;

  return {
    id: `${ID_PREFIXES.BUILDING}${osmId}`,
    osmId,
    position,
    geometry,
    type,
    tags: {
      name: tags.name,
      building: tags.building,
      shop: tags.shop,
      amenity: tags.amenity,
    },
  };
}

export function parseOSMResponse(elements) {
  const nodes = new Map();
  const links = new Map();
  const transportRoutes = new Map();
  const buildings = new Map();
  const osmNodes = indexNodes(elements);
  const osmWays = indexWays(elements);
  const nodeUsage = countNodeUsage(elements);

  // First pass: create all links
  for (const el of elements) {
    if (isOSMWay(el) && el.tags?.highway) {
      const geometry = buildGeometry(el.nodes, osmNodes);
      if (geometry.length < GEOMETRY_VALIDATION.MIN_LINK_POINTS) continue;

      const link = createLink(
        { id: el.id, nodes: el.nodes, tags: el.tags },
        geometry
      );
      links.set(link.id, link);
    }
  }

  // Second pass: create ALL nodes (not just endpoints)
  for (const el of elements) {
    if (isOSMWay(el) && el.tags?.highway) {
      // Add ALL nodes from this way, not just endpoints
      for (const osmId of el.nodes) {
        const nodeId = `${ID_PREFIXES.NODE}${osmId}`;
        if (nodes.has(nodeId)) continue;

        const osmNode = osmNodes.get(osmId);
        if (osmNode) {
          nodes.set(
            nodeId,
            createNode(osmId, osmNode, nodeUsage.get(osmId) || 1)
          );
        }
      }
    } else if (isOSMRelation(el) && el.tags?.route) {
      for (const member of el.members) {
        if (member.type !== OSM_TAG_VALUES.TYPE_WAY) continue;

        const way = osmWays.get(member.ref);
        if (!way || way.nodes.length < GEOMETRY_VALIDATION.MIN_ROUTE_POINTS) continue;

        const geometry = buildGeometry(way.nodes, osmNodes);
        if (geometry.length < GEOMETRY_VALIDATION.MIN_ROUTE_POINTS) continue;

        const route = createTransportRoute(
          el.id,
          member.ref,
          geometry,
          el.tags
        );
        transportRoutes.set(route.id, route);
      }
    } else if (isOSMNode(el) && el.tags) {
      const building = createBuilding(el.id, [el.lat, el.lon], el.tags);
      if (building) {
        buildings.set(building.id, building);
      }
    } else if (isOSMWay(el) && el.tags && !el.tags.highway) {
      const geometry = buildGeometry(el.nodes, osmNodes);
      if (geometry.length < GEOMETRY_VALIDATION.MIN_BUILDING_POLYGON_POINTS) continue;

      const centroid = [
        geometry.reduce((sum, p) => sum + p[0], 0) / geometry.length,
        geometry.reduce((sum, p) => sum + p[1], 0) / geometry.length,
      ];

      const building = createBuilding(el.id, centroid, el.tags, geometry);
      if (building) {
        buildings.set(building.id, building);
      }
    }
  }

  return { nodes, links, transportRoutes, buildings };
}
