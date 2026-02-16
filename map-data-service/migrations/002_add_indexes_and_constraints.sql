-- Spatial indexes for PostGIS queries
CREATE INDEX IF NOT EXISTS idx_nodes_geom ON nodes USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_links_geom ON links USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_buildings_geom ON buildings USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_transport_routes_geom ON transport_routes USING GIST (geom);

-- Foreign keys: links reference nodes
ALTER TABLE links ADD CONSTRAINT fk_links_from_node FOREIGN KEY (from_node) REFERENCES nodes(id);
ALTER TABLE links ADD CONSTRAINT fk_links_to_node FOREIGN KEY (to_node) REFERENCES nodes(id);
