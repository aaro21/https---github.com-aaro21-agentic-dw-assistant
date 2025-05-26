# backend/api/stage_to_bronze.py

from fastapi import APIRouter
from connections.manager import ConnectionManager
from sqlalchemy import text
from rapidfuzz import fuzz  # ✅ Add this
from datetime import datetime

router = APIRouter(prefix="/stage-to-bronze-map", tags=["stage-to-bronze"])
conn_mgr = ConnectionManager()

@router.get("/suggest")
def suggest_stage_to_bronze_map():
    stage_engine = conn_mgr.get_sqlalchemy_engine("Silver")
    bronze_engine = conn_mgr.get_sqlalchemy_engine("Bronze")

    with stage_engine.connect() as stage_conn, bronze_engine.connect() as bronze_conn:
        stage_tables = [row[0] for row in stage_conn.execute(text("""
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'
        """))]
        bronze_tables = [row[0] for row in bronze_conn.execute(text("""
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'
        """))]

    suggestions = []

    for stage_table in stage_tables:
        # 1. Try exact match first
        if stage_table in bronze_tables:
            suggestions.append({
                "stage_table": stage_table,
                "bronze_table": stage_table,
                "match_type": "exact",
                "score": 100
            })
        else:
            # 2. Try fuzzy match
            best_match = None
            best_score = 0
            for bronze_table in bronze_tables:
                score = fuzz.ratio(stage_table.lower(), bronze_table.lower())
                if score > best_score:
                    best_match = bronze_table
                    best_score = score
            if best_score >= 80:
                suggestions.append({
                    "stage_table": stage_table,
                    "bronze_table": best_match,
                    "match_type": "fuzzy",
                    "score": best_score
                })

    return suggestions