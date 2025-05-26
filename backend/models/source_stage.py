# backend/models/source_stage.py
from pydantic import BaseModel, Field
from typing import Optional

class SourceToStageRecord(BaseModel):
    source_type: str
    source_host: Optional[str] = None
    source_tns: Optional[str] = None
    source_database: Optional[str] = None
    source_schema: Optional[str] = None
    source_table: str

    stage_database: str
    stage_schema: str
    stage_table: str

    connection_name: Optional[str] = None
    notes: Optional[str] = None