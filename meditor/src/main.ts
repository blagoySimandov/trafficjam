import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-editable";

import { fetchOSMData } from "./osm-loader";
import { NetworkRenderer } from "./network-renderer";
import type { Network } from "./types";

import "./style.css";

class TrafficEditor {
  private map: L.Map;
  private renderer: NetworkRenderer;
  private network: Network | null = null;
  private loading = false;

  constructor() {
    this.map = L.map("map", {
      //@ts-ignore
      editable: true,
    }).setView([42.698, 23.322], 15); // Sofia

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(this.map);

    this.renderer = new NetworkRenderer(this.map);
    this.setupControls();
    this.setupEvents();
  }

  private setupControls() {
    // Import button
    const importControl = L.Control.extend({
      onAdd: () => {
        const container = L.DomUtil.create(
          "div",
          "leaflet-bar leaflet-control",
        );
        const button = L.DomUtil.create("a", "", container);
        button.href = "#";
        button.title = "Import OSM data";
        button.innerHTML = "📥";
        button.style.fontSize = "20px";
        button.style.display = "flex";
        button.style.alignItems = "center";
        button.style.justifyContent = "center";
        button.style.width = "34px";
        button.style.height = "34px";

        L.DomEvent.on(button, "click", (e) => {
          L.DomEvent.preventDefault(e);
          this.importArea();
        });

        return container;
      },
    });

    new importControl({ position: "topleft" }).addTo(this.map);

    // Clear button
    const clearControl = L.Control.extend({
      onAdd: () => {
        const container = L.DomUtil.create(
          "div",
          "leaflet-bar leaflet-control",
        );
        const button = L.DomUtil.create("a", "", container);
        button.href = "#";
        button.title = "Clear network";
        button.innerHTML = "🗑️";
        button.style.fontSize = "20px";
        button.style.display = "flex";
        button.style.alignItems = "center";
        button.style.justifyContent = "center";
        button.style.width = "34px";
        button.style.height = "34px";

        L.DomEvent.on(button, "click", (e) => {
          L.DomEvent.preventDefault(e);
          this.clear();
        });

        return container;
      },
    });

    new clearControl({ position: "topleft" }).addTo(this.map);
  }

  private setupEvents() {
    this.renderer.onLinkClick = (link) => {
      console.log("Link clicked:", link);
      this.showInfo(`Link: ${link.tags.name || link.tags.highway}`, {
        id: link.id,
        type: link.tags.highway,
        lanes: link.tags.lanes,
        maxspeed: link.tags.maxspeed,
        oneway: link.tags.oneway,
      });
    };

    this.renderer.onNodeClick = (node) => {
      console.log("Node clicked:", node);
      this.showInfo(`Node: ${node.id}`, {
        connections: node.connectionCount,
        position: node.position,
      });
    };
  }

  private async importArea() {
    if (this.loading) return;

    const bounds = this.map.getBounds();
    const zoom = this.map.getZoom();

    if (zoom < 14) {
      alert("Zoom in more to import (min zoom: 14)");
      return;
    }

    this.loading = true;
    this.showStatus("Loading OSM data...");

    try {
      this.network = await fetchOSMData(bounds);
      this.renderer.render(this.network);
      this.showStatus(
        `Loaded: ${this.network.links.size} links, ${this.network.nodes.size} nodes`,
      );
    } catch (err) {
      console.error(err);
      this.showStatus("Failed to load data");
    } finally {
      this.loading = false;
    }
  }

  private clear() {
    this.network = null;
    this.renderer.clear();
    this.showStatus("Cleared");
  }

  private showStatus(message: string) {
    let statusEl = document.getElementById("status");
    if (!statusEl) {
      statusEl = document.createElement("div");
      statusEl.id = "status";
      document.body.appendChild(statusEl);
    }
    statusEl.textContent = message;
  }

  private showInfo(title: string, data: Record<string, any>) {
    let infoEl = document.getElementById("info");
    if (!infoEl) {
      infoEl = document.createElement("div");
      infoEl.id = "info";
      document.body.appendChild(infoEl);
    }

    infoEl.innerHTML = `
      <strong>${title}</strong>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `;
  }
}

new TrafficEditor();
