"""Populate geometry columns from double-encoded JSON strings

The CSV import stored geometry as JSON strings (e.g. '"[[...]]"')
rather than native JSON arrays. This migration unwraps them.

Revision ID: 003
Revises: 002
Create Date: 2026-02-15
"""

from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Links: unwrap JSON string -> JSON array -> PostGIS LineString
    # Use a subquery approach to safely handle non-array values
    op.execute("""
        UPDATE links
        SET geom = sub.geom
        FROM (
            SELECT id,
                   ST_SetSRID(
                       ST_MakeLine(
                           ARRAY(
                               SELECT ST_MakePoint(
                                   (coord->>0)::double precision,
                                   (coord->>1)::double precision
                               )
                               FROM json_array_elements((geometry #>> '{}')::json) AS coord
                           )
                       ),
                       4326
                   ) AS geom
            FROM links
            WHERE geometry IS NOT NULL
              AND geom IS NULL
              AND json_typeof(geometry) = 'string'
              AND json_typeof((geometry #>> '{}')::json) = 'array'
        ) sub
        WHERE links.id = sub.id
    """)

    # Transport routes: same approach
    op.execute("""
        UPDATE transport_routes
        SET geom = sub.geom
        FROM (
            SELECT id,
                   ST_SetSRID(
                       ST_MakeLine(
                           ARRAY(
                               SELECT ST_MakePoint(
                                   (coord->>0)::double precision,
                                   (coord->>1)::double precision
                               )
                               FROM json_array_elements((geometry #>> '{}')::json) AS coord
                           )
                       ),
                       4326
                   ) AS geom
            FROM transport_routes
            WHERE geometry IS NOT NULL
              AND geom IS NULL
              AND json_typeof(geometry) = 'string'
              AND json_typeof((geometry #>> '{}')::json) = 'array'
        ) sub
        WHERE transport_routes.id = sub.id
    """)


def downgrade() -> None:
    op.execute("UPDATE links SET geom = NULL")
    op.execute("UPDATE transport_routes SET geom = NULL")
