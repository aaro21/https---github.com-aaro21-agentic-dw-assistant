# backend/api/stage_bronze.py
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from connections.manager import ConnectionManager

router = APIRouter(prefix="/stage-to-bronze-map", tags=["stage-to-bronze"])
conn_mgr = ConnectionManager()

@router.get("/suggest")
def suggest_stage_to_bronze():
    try:
        stage_engine = conn_mgr.get_sqlalchemy_engine("Silver")
        bronze_engine = conn_mgr.get_sqlalchemy_engine("Bronze")

        with stage_engine.connect() as stage_conn, bronze_engine.connect() as bronze_conn:
            stage_tables = stage_conn.execute(text("""
                SELECT table_name, table_schema FROM information_schema.tables
                WHERE table_type = 'BASE TABLE'
            """)).fetchall()

            bronze_tables = bronze_conn.execute(text("""
                SELECT table_name, table_schema FROM information_schema.tables
                WHERE table_type = 'BASE TABLE'
            """)).fetchall()

            bronze_lookup = {
                (row.table_schema.lower(), row.table_name.lower()): row
                for row in bronze_tables
            }

            suggestions = []
            for row in stage_tables:
                stage_key = (row.table_schema.lower(), row.table_name.lower())
                if stage_key in bronze_lookup:
                    suggestions.append({
                        "stage_schema": row.table_schema,
                        "stage_table": row.table_name,
                        "bronze_schema": bronze_lookup[stage_key].table_schema,
                        "bronze_table": bronze_lookup[stage_key].table_name,
                        "match": "exact"
                    })

            return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))