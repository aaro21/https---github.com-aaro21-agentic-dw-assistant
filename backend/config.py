from pydantic import BaseSettings

class Settings(BaseSettings):
    default_driver: str = "ODBC Driver 17 for SQL Server"
    class Config:
        env_file = ".env"

settings = Settings()