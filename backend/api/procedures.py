from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from connections.manager import ConnectionManager

router = APIRouter()
conn_mgr = ConnectionManager()

@router.get("/procedures/{alias}")
def list_procedures(alias: str):
    try:
        engine = conn_mgr.get_sqlalchemy_engine(alias)
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT name 
                FROM sys.procedures 
                ORDER BY name
            """))
            return [row[0] for row in result]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/procedures/{alias}/{proc_name}")
def get_procedure_definition(alias: str, proc_name: str):
    try:
        engine = conn_mgr.get_sqlalchemy_engine(alias)
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT sm.definition
                FROM sys.procedures p
                JOIN sys.sql_modules sm ON p.object_id = sm.object_id
                WHERE p.name = :proc_name
            """), {"proc_name": proc_name})
            row = result.fetchone()
            return {
                "procedure": proc_name,
                "definition": row[0] if row else "Not found"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))