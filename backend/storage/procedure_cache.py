# backend/storage/procedure_cache.py

import hashlib
from sqlalchemy import text
from connections.cache_engine import get_cache_engine


def hash_procedure(content: str) -> str:
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def get_cached_summary(db_alias: str, proc_name: str, proc_hash: str) -> str | None:
    engine = get_cache_engine()
    query = text("""
        SELECT summary
        FROM procedure_analysis_cache
        WHERE db_alias = :alias AND procedure_name = :name AND proc_hash = :hash
    """)

    with engine.connect() as conn:
        result = conn.execute(query, {
            "alias": db_alias,
            "name": proc_name,
            "hash": proc_hash
        })
        row = result.fetchone()
        return row.summary if row else None


def store_summary(db_alias: str, proc_name: str, proc_hash: str, summary: str) -> None:
    engine = get_cache_engine()
    insert = text("""
        INSERT INTO procedure_analysis_cache (db_alias, procedure_name, proc_hash, summary)
        VALUES (:alias, :name, :hash, :summary)
    """)

    with engine.begin() as conn:
        conn.execute(insert, {
            "alias": db_alias,
            "name": proc_name,
            "hash": proc_hash,
            "summary": summary
        })