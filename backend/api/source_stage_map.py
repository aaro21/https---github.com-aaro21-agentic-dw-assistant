# backend/api/source_stage_map.py
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from connections.manager import ConnectionManager

router = APIRouter()
conn_mgr = ConnectionManager()

@router.get("/source-to-stage-map")
def list_source_to_stage_mappings():
    engine = conn_mgr.get_sqlalchemy_engine("lineage")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM source_to_stage_map ORDER BY source_type, source_schema, source_table"))
        rows = [dict(row._mapping) for row in result]
        return rows

@router.post("/source-to-stage-map")
def add_mapping(mapping: dict):
    try:
        engine = conn_mgr.get_sqlalchemy_engine("lineage")
        with engine.begin() as conn:
            conn.execute(text("""
                INSERT INTO source_to_stage_map (
                    source_type, source_host, source_database, source_schema, source_table, source_tns,
                    stage_database, stage_schema, stage_table
                ) VALUES (
                    :source_type, :source_host, :source_database, :source_schema, :source_table, :source_tns,
                    :stage_database, :stage_schema, :stage_table
                )
            """), mapping)
        return {"status": "added"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))