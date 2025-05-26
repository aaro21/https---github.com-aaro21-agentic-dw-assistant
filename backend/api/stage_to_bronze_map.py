from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.sql import text
from datetime import datetime
from connections.manager import ConnectionManager

router = APIRouter(prefix="/stage-to-bronze-map", tags=["stage-to-bronze"])
conn_mgr = ConnectionManager()

class StageToBronzeMapping(BaseModel):
    stage_database: str
    stage_schema: str
    stage_table: str
    bronze_database: str
    bronze_schema: str
    bronze_table: str

@router.post("/suggest")
def suggest_stage_to_bronze():
    try:
        engine = conn_mgr.get_sqlalchemy_engine("lineage")
        with engine.connect() as conn:
            stage_rows = conn.execute(text(
                "SELECT stage_schema, stage_table FROM source_to_stage_map"
            )).mappings().all()

            bronze_rows = conn.execute(text(
                "SELECT DISTINCT bronze_schema, bronze_table FROM stage_to_bronze_map"
            )).mappings().all()

            stage_set = {(r["stage_schema"].lower(), r["stage_table"].lower()) for r in stage_rows}
            bronze_set = {(r["bronze_schema"].lower(), r["bronze_table"].lower()) for r in bronze_rows}

            suggestions = []
            for schema, table in stage_set:
                if (schema, table) not in bronze_set:
                    suggestions.append({
                        "stage_schema": schema,
                        "stage_table": table,
                        "bronze_schema": schema,
                        "bronze_table": table
                    })

            return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stage-to-bronze-map/bulk")
def save_stage_to_bronze_bulk(mappings: List[StageToBronzeMapping]):
    try:
        engine = conn_mgr.get_sqlalchemy_engine("lineage")
        now = datetime.utcnow()
        with engine.begin() as conn:
            for m in mappings:
                conn.execute(text("""
                    INSERT INTO stage_to_bronze_map (
                        stage_database, stage_schema, stage_table,
                        bronze_database, bronze_schema, bronze_table,
                        created_at
                    )
                    VALUES (:stage_db, :stage_schema, :stage_table,
                            :bronze_db, :bronze_schema, :bronze_table,
                            :created_at)
                """), {
                    "stage_db": m.stage_database,
                    "stage_schema": m.stage_schema,
                    "stage_table": m.stage_table,
                    "bronze_db": m.bronze_database,
                    "bronze_schema": m.bronze_schema,
                    "bronze_table": m.bronze_table,
                    "created_at": now
                })
        return {"status": "success", "rows": len(mappings)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))