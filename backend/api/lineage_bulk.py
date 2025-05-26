# backend/api/lineage_bulk.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from connections.manager import ConnectionManager
from sqlalchemy import text
from utils.hashing import hash_string
from agents.lineage_agent import summarize_lineage
from datetime import datetime

router = APIRouter()
conn_mgr = ConnectionManager()


class BulkLineageRequest(BaseModel):
    alias: str
    schema: str = None  # optional: if None, analyze all procedures


@router.post("/lineage/bulk/by-schema")
def bulk_analyze_by_schema(payload: BulkLineageRequest):
    try:
        engine = conn_mgr.get_sqlalchemy_engine(payload.alias)
        with engine.connect() as conn:
            query = """
                SELECT p.name
                FROM sys.procedures p
                JOIN sys.schemas s ON p.schema_id = s.schema_id
                WHERE (:schema IS NULL OR s.name = :schema)
                ORDER BY s.name, p.name
            """
            result = conn.execute(text(query), {"schema": payload.schema})
            procedures = [row[0] for row in result]

            results = []
            for proc in procedures:
                body_result = conn.execute(text("""
                    SELECT sm.definition
                    FROM sys.procedures p
                    JOIN sys.sql_modules sm ON p.object_id = sm.object_id
                    WHERE p.name = :proc_name
                """), {"proc_name": proc})
                row = body_result.fetchone()
                if not row:
                    continue
                body = row[0]
                lineage = summarize_lineage(proc, payload.alias, body)

                # Store lineage result
                now = datetime.utcnow()
                conn2 = conn_mgr.get_sqlalchemy_engine("lineage").connect()
                with conn2.begin():
                    # Clean up previous lineage for this proc
                    conn2.execute(text("""
                        DELETE FROM lineage_map
                        WHERE procedure_name = :proc AND database_name = :db
                    """), {"proc": proc, "db": payload.alias})

                    for mapping in lineage.get("column_mappings", []):
                        conn2.execute(text("""
                            INSERT INTO lineage_map (
                                procedure_name, database_name, schema_name,
                                source_table, target_table, source_column,
                                target_column, source_full, analyzed_at, hash
                            )
                            VALUES (:proc, :db, :schema, :src_table, :tgt_table,
                                    :src_col, :tgt_col, :src_full, :ts, :hash)
                        """), {
                            "proc": proc,
                            "db": payload.alias,
                            "schema": lineage["target_table"].split(".")[0],
                            "src_table": mapping["source_table"].split(".")[-1],
                            "tgt_table": lineage["target_table"].split(".")[-1],
                            "src_col": mapping["source"],
                            "tgt_col": mapping["target"],
                            "src_full": mapping["source_table"],
                            "ts": now,
                            "hash": lineage["hash"],
                        })
                results.append(proc)

        return {"status": "ok", "procedures_analyzed": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))