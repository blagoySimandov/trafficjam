from pydantic import BaseModel


class OSMNode(BaseModel):
    type: str
    id: int
    lat: float
    lon: float


class OSMWay(BaseModel):
    type: str
    id: int
    nodes: list[int]
    tags: dict[str, str] = {}


class OSMRelationMember(BaseModel):
    type: str
    ref: int
    role: str = ""


class OSMRelation(BaseModel):
    type: str
    id: int
    members: list[OSMRelationMember] = []
    tags: dict[str, str] = {}


class OSMApiResponse(BaseModel):
    elements: list[OSMNode | OSMWay | OSMRelation]
