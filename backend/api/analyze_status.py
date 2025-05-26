# backend/api/analyze_status.py

from fastapi import APIRouter, HTTPException
from sqlalchemy import inspect, text
from connections.manager import ConnectionManager
from connections.cache_engine import get_cache_engine
from storage.procedure_cache import hash_procedure

router = APIRouter()
conn_mgr = ConnectionManager()

@router.get("/analyze/status/{alias}")
def get_analysis_status(alias: str):
    try:
        engine = conn_mgr.get_sqlalchemy_engine(alias)
        cache_engine = get_cache_engine()

        # Get all procedure names and definitions
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT p.name, sm.definition
                FROM sys.procedures p
                JOIN sys.sql_modules sm ON p.object_id = sm.object_id
            """))
            procs = {row.name: row.definition for row in result}

        # Get all cached entries for this alias
        with cache_engine.connect() as conn:
            cached = conn.execute(text("""
                SELECT procedure_name, proc_hash
                FROM procedure_analysis_cache
                WHERE db_alias = :alias
            """), {"alias": alias})
            cached_map = {row.procedure_name: row.proc_hash for row in cached}

        status = {}
        for name, body in procs.items():
            hash_val = hash_procedure(body)
            if name not in cached_map:
                status[name] = "not_analyzed"
            elif cached_map[name] == hash_val:
                status[name] = "up_to_date"
            else:
                status[name] = "outdated"

        return status

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))