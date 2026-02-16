-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Nodes table
CREATE TABLE IF NOT EXISTS nodes (
    id BIGINT PRIMARY KEY,
    longitude DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    connection_count INTEGER NOT NULL,
    geom GEOMETRY(POINT, 4326)
);

-- Links table
CREATE TABLE IF NOT EXISTS links (
    id BIGINT PRIMARY KEY,
    from_node BIGINT NOT NULL,
    to_node BIGINT NOT NULL,
    geometry JSON NOT NULL,
    highway TEXT,
    lanes TEXT,
    maxspeed TEXT,
    name TEXT,
    ref TEXT,
    surface TEXT,
    oneway TEXT,
    geom GEOMETRY(LINESTRING, 4326)
);

-- Buildings table
CREATE TABLE IF NOT EXISTS buildings (
    id BIGINT PRIMARY KEY,
    longitude DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    geometry JSON NOT NULL,
    type TEXT,
    building TEXT,
    building_levels TEXT,
    name TEXT,
    addr_street TEXT,
    shop TEXT,
    geom GEOMETRY(POINT, 4326)
);

-- Transport routes table
CREATE TABLE IF NOT EXISTS transport_routes (
    id BIGINT PRIMARY KEY,
    way_id INTEGER NOT NULL,
    geometry JSON NOT NULL,
    colour TEXT,
    "from" TEXT,
    name TEXT,
    network TEXT,
    operator TEXT,
    ref TEXT,
    route TEXT,
    "to" TEXT,
    geom GEOMETRY(LINESTRING, 4326)
);
