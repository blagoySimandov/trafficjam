from sqlalchemy import Column, BigInteger, Integer, Text, Double
from sqlalchemy.dialects.postgresql import JSON
from geoalchemy2 import Geometry
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class NodeDB(Base):
    __tablename__ = "nodes"

    id = Column(BigInteger, primary_key=True)
    longitude = Column(Double, nullable=False)
    latitude = Column(Double, nullable=False)
    connection_count = Column(Integer, nullable=False)
    geom = Column(Geometry(geometry_type="POINT", srid=4326))


class LinkDB(Base):
    __tablename__ = "links"

    id = Column(BigInteger, primary_key=True)
    from_node = Column(BigInteger, nullable=False)
    to_node = Column(BigInteger, nullable=False)
    geometry = Column(JSON, nullable=False)
    highway = Column(Text)
    lanes = Column(Text)
    maxspeed = Column(Text)
    name = Column(Text)
    ref = Column(Text)
    surface = Column(Text)
    oneway = Column(Text)
    geom = Column(Geometry(geometry_type="LINESTRING", srid=4326))


class BuildingDB(Base):
    __tablename__ = "buildings"

    id = Column(BigInteger, primary_key=True)
    longitude = Column(Double, nullable=False)
    latitude = Column(Double, nullable=False)
    geometry = Column(JSON, nullable=False)
    type = Column(Text)
    building = Column(Text)
    building_levels = Column(Text)
    name = Column(Text)
    addr_street = Column(Text)
    shop = Column(Text)
    geom = Column(Geometry(geometry_type="POINT", srid=4326))


class TransportRouteDB(Base):
    __tablename__ = "transport_routes"

    id = Column(BigInteger, primary_key=True)
    way_id = Column(Integer, nullable=False)
    geometry = Column(JSON, nullable=False)
    colour = Column(Text)
    from_ = Column("from", Text)
    name = Column(Text)
    network = Column(Text)
    operator = Column(Text)
    ref = Column(Text)
    route = Column(Text)
    to = Column(Text)
    geom = Column(Geometry(geometry_type="LINESTRING", srid=4326))
