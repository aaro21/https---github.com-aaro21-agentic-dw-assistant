# backend/api/sources.py
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from connections.manager import ConnectionManager
from datetime import datetime

router = APIRouter()
conn_mgr = ConnectionManager()

@router.post("/sources/discover")
def discover_source_tables():
    discovered = []

    for alias, config in conn_mgr.connections.items():
        if config.get("role") != "source":
            continue

        engine = conn_mgr.get_sqlalchemy_engine(alias)
        conn_type = config.get("type")

        try:
            with engine.connect() as conn:
                if conn_type == "sqlserver":
                    result = conn.execute(text("""
                        SELECT TABLE_SCHEMA, TABLE_NAME
                        FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_TYPE = 'BASE TABLE'
                    """))
                    for row in result:
                        discovered.append({
                            "connection_alias": alias,
                            "source_type": "sqlserver",
                            "schema_name": row.TABLE_SCHEMA,
                            "table_name": row.TABLE_NAME,
                            "database_name": config.get("database"),
                            "last_seen": datetime.utcnow()
                        })

                elif conn_type == "oracle":
                    result = conn.execute(text("""
                        SELECT OWNER AS schema_name, TABLE_NAME
                        FROM ALL_TABLES
                    """))
                    for row in result:
                        ezconnect = f"{config['host']}:{config['port']}/{config['service_name']}"
                        discovered.append({
                            "connection_alias": alias,
                            "source_type": "oracle",
                            "schema_name": row.SCHEMA_NAME,
                            "table_name": row.TABLE_NAME,
                            "host": config.get("host"),
                            "port": config.get("port"),
                            "service_name": config.get("service_name"),
                            "ezconnect": ezconnect,
                            "last_seen": datetime.utcnow()
                        })

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error querying {alias}: {e}")

    return discovered