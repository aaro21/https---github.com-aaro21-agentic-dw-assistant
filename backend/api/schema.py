from fastapi import APIRouter, HTTPException
from sqlalchemy import inspect
from connections.manager import ConnectionManager

router = APIRouter()
conn_mgr = ConnectionManager()

@router.get("/connections")
def list_connections():
    return list(conn_mgr.connections.keys())

@router.get("/tables/{alias}")
def list_tables(alias: str):
    try:
        engine = conn_mgr.get_sqlalchemy_engine(alias)
        inspector = inspect(engine)
        tables = []
        for schema_name in inspector.get_schema_names():
            for table_name in inspector.get_table_names(schema=schema_name):
                tables.append(f"{schema_name}.{table_name}")
        return sorted(tables)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tables/{alias}/{table}/columns")
def list_columns(alias: str, table: str):
    try:
        engine = conn_mgr.get_sqlalchemy_engine(alias)
        inspector = inspect(engine)
        if '.' in table:
            schema_name, table_name = table.split('.', 1)
        else:
            schema_name, table_name = None, table
        raw_columns = inspector.get_columns(table_name, schema=schema_name)
        return [
            {
                "name": col["name"],
                "type": str(col["type"]),
                "nullable": col.get("nullable", False),
                "default": col.get("default")
            }
            for col in raw_columns
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))