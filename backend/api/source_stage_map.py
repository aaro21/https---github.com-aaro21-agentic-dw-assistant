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

def get_table_signatures(engine):
    result = []
    with engine.connect() as conn:
        tables = conn.execute(text("""
            SELECT TABLE_SCHEMA, TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE'
        """)).fetchall()

        for schema, table in tables:
            cols = conn.execute(text(f"""
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = :table
                ORDER BY ORDINAL_POSITION
            """), {"schema": schema, "table": table}).fetchall()
            col_names = [c[0].lower() for c in cols]
            result.append((schema, table, col_names))

    return result

@router.post("/source-to-stage/auto-map")
def auto_map_source_to_stage():
    try:
        stage_engine = conn_mgr.get_sqlalchemy_engine("Stage")

        stage_tables = get_table_signatures(stage_engine)
        mapped_rows = []

        for alias, config in conn_mgr.connections.items():
            if config.get("type") != "source":
                continue

            source_engine = conn_mgr.get_sqlalchemy_engine(alias)
            source_tables = get_table_signatures(source_engine)

            for (s_schema, s_table, s_cols) in source_tables:
                for (t_schema, t_table, t_cols) in stage_tables:
                    if s_table.lower() == t_table.lower() and set(s_cols) == set(t_cols):
                        mapped_rows.append({
                            "source_alias": alias,
                            "source_schema": s_schema,
                            "source_table": s_table,
                            "stage_schema": t_schema,
                            "stage_table": t_table
                        })

        # Save to DB
        lineage_engine = conn_mgr.get_sqlalchemy_engine("lineage")
        with lineage_engine.begin() as conn:
            for row in mapped_rows:
                conn.execute(text("""
                    INSERT INTO source_to_stage_map (
                        source_alias, source_schema, source_table,
                        stage_schema, stage_table
                    )
                    VALUES (:source_alias, :source_schema, :source_table, :stage_schema, :stage_table)
                """), row)

        return {"mapped": len(mapped_rows)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))