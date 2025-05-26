from pydantic import BaseModel

class DatabaseConnection(BaseModel):
    alias: str
    type: str  # "sqlserver" or "oracle"
    server: str | None = None
    database: str | None = None
    driver: str = "ODBC Driver 17 for SQL Server"
    user: str | None = None
    password: str | None = None
    dsn: str | None = None
    use_trusted_connection: bool = False
    trust_server_cert: bool = False