from pydantic import BaseModel
from typing import Optional, List, Dict


class Building(BaseModel):
    id: str
    nodes: List[str]
    tags: Optional[Dict[str, str]] = None

    def get_tag(self, key: str, default=None):
        if self.tags:
            return self.tags.get(key, default)
        return default
