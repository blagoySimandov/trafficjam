"""Add PostGIS geometry columns and populate from existing data

Revision ID: 002
Revises: 001
Create Date: 2026-02-15
"""

from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add geometry columns
    op.execute("ALTER TABLE nodes ADD COLUMN geom geometry(POINT, 4326)")
    op.execute("ALTER TABLE links ADD COLUMN geom geometry(LINESTRING, 4326)")
    op.execute("ALTER TABLE buildings ADD COLUMN geom geometry(POINT, 4326)")
    op.execute("ALTER TABLE transport_routes ADD COLUMN geom geometry(LINESTRING, 4326)")

    # Populate nodes geom from longitude/latitude
    op.execute("""
        UPDATE nodes
        SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
    """)

    # Populate links geom from JSON geometry array
    # Filter to rows where geometry is a JSON array (not a scalar)
    op.execute("""
        UPDATE links
        SET geom = ST_SetSRID(
            ST_MakeLine(
                ARRAY(
                    SELECT ST_MakePoint(
                        (coord->>0)::double precision,
                        (coord->>1)::double precision
                    )
                    FROM json_array_elements(geometry) AS coord
                )
            ),
            4326
        )
        WHERE geometry IS NOT NULL
          AND json_typeof(geometry) = 'array'
    """)

    # Populate buildings geom from longitude/latitude
    op.execute("""
        UPDATE buildings
        SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
    """)

    # Populate transport_routes geom from JSON geometry array
    op.execute("""
        UPDATE transport_routes
        SET geom = ST_SetSRID(
            ST_MakeLine(
                ARRAY(
                    SELECT ST_MakePoint(
                        (coord->>0)::double precision,
                        (coord->>1)::double precision
                    )
                    FROM json_array_elements(geometry) AS coord
                )
            ),
            4326
        )
        WHERE geometry IS NOT NULL
          AND json_typeof(geometry) = 'array'
    """)

    # Create spatial indexes
    op.execute("CREATE INDEX idx_nodes_geom ON nodes USING GIST (geom)")
    op.execute("CREATE INDEX idx_links_geom ON links USING GIST (geom)")
    op.execute("CREATE INDEX idx_buildings_geom ON buildings USING GIST (geom)")
    op.execute("CREATE INDEX idx_transport_routes_geom ON transport_routes USING GIST (geom)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_nodes_geom")
    op.execute("DROP INDEX IF EXISTS idx_links_geom")
    op.execute("DROP INDEX IF EXISTS idx_buildings_geom")
    op.execute("DROP INDEX IF EXISTS idx_transport_routes_geom")

    op.drop_column("nodes", "geom")
    op.drop_column("links", "geom")
    op.drop_column("buildings", "geom")
    op.drop_column("transport_routes", "geom")
