# backend/models/lineage.py
from pydantic import BaseModel
from typing import List, Optional

class ColumnMapping(BaseModel):
    source: str
    target: str
    source_table: Optional[str] = None

class LineageResult(BaseModel):
    source_tables: List[str]
    target_table: str
    column_mappings: List[ColumnMapping]

class BulkLineageRequest(BaseModel):
    alias: str
    schema: Optional[str] = None