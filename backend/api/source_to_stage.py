# backend/api/source_to_stage.py
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from models.source_stage import SourceToStageRecord
from connections.manager import ConnectionManager
from datetime import datetime

router = APIRouter(prefix="/source-to-stage-map", tags=["source-to-stage"])
conn_mgr = ConnectionManager()

@router.post("/")
def add_source_to_stage_mapping(record: SourceToStageRecord):
    try:
        engine = conn_mgr.get_sqlalchemy_engine("lineage")
        with engine.begin() as conn:
            conn.execute(text("""
                INSERT INTO source_to_stage_map (
                    source_type, source_host, source_tns,
                    source_database, source_schema, source_table,
                    stage_database, stage_schema, stage_table,
                    connection_name, notes, created_at
                )
                VALUES (
                    :source_type, :source_host, :source_tns,
                    :source_database, :source_schema, :source_table,
                    :stage_database, :stage_schema, :stage_table,
                    :connection_name, :notes, :created_at
                )
            """), {
                **record.dict(),
                "created_at": datetime.utcnow()
            })
        return {"status": "inserted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))