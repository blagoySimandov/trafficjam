from pydantic import BaseModel
from typing import Optional


class Building(BaseModel):
    id: str
    osm_id: int
    position: tuple[float, float]
    geometry: list[tuple[float, float]]
    type: Optional[str] = None
    tags: dict[str, str]

    def get_tag(self, key: str) -> Optional[str]:
        return self.tags.get(key)
