import L from "leaflet";
import type { Network, TrafficNode, TrafficLink } from "./types";

const ROAD_COLORS: Record<string, string> = {
  motorway: "#e892a2",
  motorway_link: "#e892a2",
  trunk: "#f9b29c",
  trunk_link: "#f9b29c",
  primary: "#fcd6a4",
  primary_link: "#fcd6a4",
  secondary: "#f7fabf",
  secondary_link: "#f7fabf",
  tertiary: "#ffffff",
  tertiary_link: "#ffffff",
  residential: "#cccccc",
  service: "#aaaaaa",
  unclassified: "#bbbbbb",
};

const ROAD_WEIGHTS: Record<string, number> = {
  motorway: 5,
  motorway_link: 3,
  trunk: 4,
  trunk_link: 3,
  primary: 4,
  primary_link: 2,
  secondary: 3,
  secondary_link: 2,
  tertiary: 2,
  residential: 2,
  service: 1,
  unclassified: 2,
};

export class NetworkRenderer {
  private linkLayer: L.LayerGroup;
  private nodeLayer: L.LayerGroup;
  private selectedId: string | null = null;

  onLinkClick?: (link: TrafficLink) => void;
  onNodeClick?: (node: TrafficNode) => void;

  constructor(map: L.Map) {
    this.linkLayer = L.layerGroup().addTo(map);
    this.nodeLayer = L.layerGroup().addTo(map);
  }

  render(network: Network) {
    this.clear();

    // Render links first (below nodes)
    for (const link of network.links.values()) {
      this.renderLink(link);
    }

    // Render nodes on top
    for (const node of network.nodes.values()) {
      this.renderNode(node);
    }
  }

  private renderLink(link: TrafficLink) {
    const color = ROAD_COLORS[link.tags.highway] || "#888888";
    const weight = ROAD_WEIGHTS[link.tags.highway] || 2;
    const isSelected = link.id === this.selectedId;

    const polyline = L.polyline(link.geometry, {
      color: isSelected ? "#fbbf24" : color,
      weight: isSelected ? weight + 2 : weight,
      opacity: 0.9,
      lineCap: "round",
      lineJoin: "round",
    });

    // Add outline for better visibility
    const outline = L.polyline(link.geometry, {
      color: "#333333",
      weight: weight + 2,
      opacity: 0.4,
      lineCap: "round",
      lineJoin: "round",
    });

    outline.addTo(this.linkLayer);
    polyline.addTo(this.linkLayer);

    polyline.on("click", (e) => {
      L.DomEvent.stopPropagation(e);
      this.onLinkClick?.(link);
    });

    // Tooltip with road name
    if (link.tags.name) {
      polyline.bindTooltip(link.tags.name, { sticky: true });
    }
  }

  private renderNode(node: TrafficNode) {
    const isSelected = node.id === this.selectedId;
    const isJunction = node.connectionCount >= 3;

    const marker = L.circleMarker(node.position, {
      radius: isJunction ? 6 : 4,
      color: isSelected ? "#fbbf24" : isJunction ? "#3b82f6" : "#666666",
      fillColor: isSelected ? "#fbbf24" : isJunction ? "#60a5fa" : "#888888",
      fillOpacity: 0.8,
      weight: 2,
    });

    marker.addTo(this.nodeLayer);

    marker.on("click", (e) => {
      L.DomEvent.stopPropagation(e);
      this.onNodeClick?.(node);
    });
  }

  select(id: string | null) {
    this.selectedId = id;
  }

  clear() {
    this.linkLayer.clearLayers();
    this.nodeLayer.clearLayers();
  }

  destroy() {
    this.linkLayer.remove();
    this.nodeLayer.remove();
  }
}
