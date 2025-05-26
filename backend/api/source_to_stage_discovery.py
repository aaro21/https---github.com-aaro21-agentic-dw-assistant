# api/source_to_stage_discovery.py
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from connections.manager import ConnectionManager

router = APIRouter()
conn_mgr = ConnectionManager()

@router.post("/source-to-stage/discover/{source_alias}")
def discover_stage_mappings(source_alias: str, stage_alias: str):
    try:
        source_cfg = conn_mgr.connections[source_alias]
        stage_cfg = conn_mgr.connections[stage_alias]

        default_stage_schema = source_cfg.get("default_stage_schema", "dbo")
        stage_table_prefix = source_cfg.get("stage_table_prefix", "")

        engine = conn_mgr.get_sqlalchemy_engine(source_alias)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT owner, table_name FROM all_tables"))
            rows = result.fetchall()

        proposed = []
        for owner, table_name in rows:
            mapped = {
                "source_type": source_cfg["type"],
                "source_alias": source_alias,
                "source_schema": owner,
                "source_table": table_name,
                "stage_alias": stage_alias,
                "stage_schema": default_stage_schema,
                "stage_table": f"{stage_table_prefix}{table_name.lower()}"
            }
            proposed.append(mapped)

        return proposed

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))