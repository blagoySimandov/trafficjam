from pydantic import BaseModel


class Building(BaseModel):
    id: str
    osm_id: int
    position: tuple[float, float]
    geometry: list[tuple[float, float]]
    type: str | None = None
    tags: dict[str, str]

    def get_tag(self, key: str) -> str | None:
        return self.tags.get(key)
