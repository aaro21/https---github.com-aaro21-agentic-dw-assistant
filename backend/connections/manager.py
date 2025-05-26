# connections/manager.py
import os
from sqlalchemy import create_engine
import json

class ConnectionManager:
    def __init__(self):
        with open("connections/connections.json") as f:
            self.connections = json.load(f)
        self.cache = {}

    def get_sqlalchemy_engine(self, alias: str):
        if alias in self.cache:
            return self.cache[alias]

        if alias == "lineage":
            engine = self._build_lineage_engine()
        elif alias in self.connections:
            config = self.connections[alias]
            engine = self._build_engine_from_config(config)
        else:
            raise ValueError(f"Unsupported connection: {alias}")

        self.cache[alias] = engine
        return engine

    def _build_engine_from_config(self, config: dict):
        driver = config.get("driver", "ODBC Driver 18 for SQL Server")

        if config.get("use_trusted_connection"):
            conn_str = (
                f"mssql+pyodbc://@{config['server']}/{config['database']}?"
                f"driver={driver}&trusted_connection=yes"
            )
        else:
            user = os.getenv(config.get("user_env"))
            password = os.getenv(config.get("password_env"))
            if not user or not password:
                raise ValueError(f"Missing credentials for {config.get('alias', 'unknown')}")
            conn_str = (
                f"mssql+pyodbc://{user}:{password}@"
                f"{config['server']}/{config['database']}?driver={driver}"
            )

        if config.get("trust_server_cert"):
            conn_str += "&TrustServerCertificate=yes"

        return create_engine(conn_str)

    def _build_lineage_engine(self):
        driver = os.getenv("LINEAGE_DRIVER", "ODBC Driver 18 for SQL Server")
        server = os.environ["LINEAGE_SERVER"]
        database = os.environ["LINEAGE_DATABASE"]
        trust_cert = os.getenv("LINEAGE_TRUST_SERVER_CERT", "true").lower() == "true"

        if os.getenv("LINEAGE_USE_TRUSTED_CONNECTION", "false").lower() == "true":
            conn_str = (
                f"mssql+pyodbc://@{server}/{database}?driver={driver}&trusted_connection=yes"
            )
        else:
            username = os.environ["LINEAGE_USERNAME"]
            password = os.environ["LINEAGE_PASSWORD"]
            conn_str = (
                f"mssql+pyodbc://{username}:{password}@{server}/{database}?driver={driver}"
            )

        if trust_cert:
            conn_str += "&TrustServerCertificate=yes"

        return create_engine(conn_str)