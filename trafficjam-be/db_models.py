from typing import Optional, List
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship

class Job(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    status: str = Field(default="PENDING")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    events: List["Event"] = Relationship(back_populates="job")

class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    job_id: Optional[int] = Field(default=None, foreign_key="job.id")
    type: str
    payload: str # JSON string
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    job: Optional[Job] = Relationship(back_populates="events")
