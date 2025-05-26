# connections/discovery_oracle.py
import os
from sqlalchemy import create_engine, text
from connections.manager import ConnectionManager


def discover_oracle_source(alias: str):
    """
    Discover tables and columns from an Oracle source.
    Alias must be defined in connections.json with type: oracle, and have corresponding
    ORACLE_USER_<ALIAS> and ORACLE_PASSWORD_<ALIAS> in .env
    """
    conn_mgr = ConnectionManager()
    config = conn_mgr.connections.get(alias)

    if not config:
        raise ValueError(f"Alias '{alias}' not found in connections.json")

    if config.get("type") != "oracle":
        raise ValueError(f"Alias '{alias}' is not of type 'oracle'")

    user = os.getenv(f"ORACLE_USER_{alias.upper()}")
    password = os.getenv(f"ORACLE_PASSWORD_{alias.upper()}")
    if not user or not password:
        raise EnvironmentError(f"Missing ORACLE_USER_{alias.upper()} or ORACLE_PASSWORD_{alias.upper()} in .env")

    # Build Oracle connection string
    host = config["host"]
    port = config.get("port", 1521)
    service_name = config["service"]

    dsn = f"(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST={host})(PORT={port}))(CONNECT_DATA=(SERVICE_NAME={service_name})))"
    engine = create_engine(f"oracle+cx_oracle://{user}:{password}@{dsn}")

    tables = []
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT owner, table_name
            FROM all_tables
            WHERE owner NOT IN ('SYS', 'SYSTEM')
            ORDER BY owner, table_name
        """))
        for row in result:
            tables.append({"schema": row["owner"], "table": row["table_name"]})

    return tables