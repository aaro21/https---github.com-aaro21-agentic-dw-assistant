import os
from urllib.parse import quote_plus
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

def get_cache_engine():
    driver = os.getenv("CACHE_DB_DRIVER", "ODBC Driver 18 for SQL Server")
    server = os.getenv("CACHE_DB_SERVER")
    db = os.getenv("CACHE_DB_NAME")
    use_trusted = os.getenv("CACHE_DB_TRUSTED", "false").lower() == "true"
    trust_cert = os.getenv("CACHE_DB_TRUST_CERT", "false").lower() == "true"

    quoted_driver = quote_plus(driver)
    trusted_cert = "TrustServerCertificate=yes" if trust_cert else ""

    if use_trusted:
        conn_str = (
            f"mssql+pyodbc://@{server}/{db}"
            f"?driver={quoted_driver}&Trusted_Connection=yes&{trusted_cert}"
        )
    else:
        user = os.getenv("CACHE_DB_USER")
        password = os.getenv("CACHE_DB_PASSWORD")
        if not user or not password:
            raise ValueError("Missing CACHE_DB_USER or CACHE_DB_PASSWORD for SQL auth")
        quoted_pwd = quote_plus(password)
        conn_str = (
            f"mssql+pyodbc://{user}:{quoted_pwd}@{server}/{db}"
            f"?driver={quoted_driver}&{trusted_cert}"
        )

    return create_engine(conn_str)