# backend/api/lineage.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from connections.manager import ConnectionManager
from utils.hashing import hash_string
from datetime import datetime
from agents.lineage_agent import summarize_lineage
import json

router = APIRouter()
conn_mgr = ConnectionManager()

class LineageRecord(BaseModel):
    procedure_name: str
    database: str
    content: str
    lineage: dict

class LineageRequest(BaseModel):
    procedure_name: str
    database: str
    content: str

@router.post("/lineage")
def analyze_lineage(request: LineageRequest):
    result = summarize_lineage(
        proc_name=request.procedure_name,
        database=request.database,
        content=request.content
    )
    return result

@router.post("/lineage/save")
def save_lineage(record: LineageRecord):
    try:
        lineage = record.lineage
        hash_val = hash_string(record.content)
        now = datetime.utcnow()

        engine = conn_mgr.get_sqlalchemy_engine("lineage")
        with engine.begin() as conn:
            # 🧹 DELETE existing mappings for this proc + hash
            conn.execute(text("""
                DELETE FROM lineage_map
                WHERE procedure_name = :proc AND hash = :hash
            """), {
                "proc": record.procedure_name,
                "hash": hash_val,
            })

            # ✅ INSERT new mappings
            for mapping in lineage.get("column_mappings", []):
                conn.execute(text("""
                    INSERT INTO lineage_map (
                        procedure_name,
                        database_name,
                        schema_name,
                        source_table,
                        target_table,
                        source_column,
                        target_column,
                        source_full,
                        analyzed_at,
                        hash
                    )
                    VALUES (:proc, :db, :schema, :src_table, :tgt_table, :src_col, :tgt_col, :src_full, :ts, :hash)
                """), {
                    "proc": record.procedure_name,
                    "db": record.database,
                    "schema": lineage["target_table"].split(".")[0],
                    "src_table": mapping["source_table"].split(".")[-1],
                    "tgt_table": lineage["target_table"].split(".")[-1],
                    "src_col": mapping["source"],
                    "tgt_col": mapping["target"],
                    "src_full": mapping["source_table"],
                    "ts": now,
                    "hash": hash_val,
                })

        return {"status": "saved", "rows": len(lineage.get("column_mappings", []))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))