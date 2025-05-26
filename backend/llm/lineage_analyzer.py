# backend/llm/lineage_analyzer.py

from typing import List, Dict
from openai import AzureOpenAI
import os
import hashlib
import re

endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
api_key = os.getenv("AZURE_OPENAI_KEY")
deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "model-router")
api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")

client = AzureOpenAI(
    api_key=api_key,
    azure_endpoint=endpoint,
    api_version=api_version,
)

def summarize_lineage(proc_name: str, content: str) -> Dict:
    prompt = f"""
You are a SQL data engineer assistant.

Analyze the following SQL Server stored procedure named `{proc_name}`.

Return a JSON summary of the source-to-target lineage, formatted like this:

{{
  "source_tables": ["source_db.schema.table"],
  "target_table": "target_schema.table",
  "column_mappings": [
    {{ "source": "source_col", "target": "target_col", "source_table": "table_name" }}
  ]
}}

Only include tables that directly participate in data movement. Do not infer beyond joins if it’s unclear.

SQL Procedure:
```
{content}
```
"""

    response = client.chat.completions.create(
        model=deployment,
        messages=[
            {"role": "system", "content": "You extract data lineage from SQL Server stored procedures."},
            {"role": "user", "content": prompt},
        ],
        temperature=0,
    )

    try:
        import json
        raw = response.choices[0].message.content.strip()
        print("\n[DEBUG] Raw LLM Response:\n", raw)
        match = re.search(r"```(?:json)?\n(.*?)```", raw, re.DOTALL)
        clean_json = match.group(1).strip() if match else raw
        parsed = json.loads(clean_json)
        return {
            "source_tables": parsed.get("source_tables", []),
            "target_table": parsed.get("target_table", ""),
            "column_mappings": parsed.get("column_mappings", []),
            "_raw": raw,
            "_prompt": prompt
        }
    except Exception as e:
        return {
            "error": str(e),
            "raw_response": response.choices[0].message.content,
            "_prompt": prompt
        }