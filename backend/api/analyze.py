# backend/api/analyze.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from llm.azure_client import get_llm
from storage.procedure_cache import (
    hash_procedure,
    get_cached_summary,
    store_summary,
)

router = APIRouter()

class AnalyzeRequest(BaseModel):
    content: str
    procedure_name: str
    db_alias: str

@router.post("/analyze")
async def analyze_proc(req: AnalyzeRequest):
    try:
        proc_hash = hash_procedure(req.content)

        # Try to get cached summary
        cached = get_cached_summary(req.db_alias, req.procedure_name, proc_hash)
        if cached:
            return {"summary": cached, "cached": True}

        # If not cached, run LLM
        llm = get_llm()
        prompt = (
            "You're a data engineer helping understand SQL Server stored procedures.\n"
            "Summarize what this stored procedure does.\n"
            "Highlight any source and destination tables, transformation steps, and logic.\n\n"
            f"SQL:\n{req.content}"
        )

        response = llm.invoke(prompt)
        summary = response.content

        # Store result
        store_summary(req.db_alias, req.procedure_name, proc_hash, summary)

        return {"summary": summary, "cached": False}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))