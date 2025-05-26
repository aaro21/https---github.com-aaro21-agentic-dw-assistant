from utils.hashing import hash_string
from utils.llm import call_model
from models.lineage import LineageResult
import json

def summarize_lineage(proc_name: str, database: str, content: str) -> dict:
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
""".strip()

    response = call_model(prompt)

    try:
        extracted = response.content.strip()
        if extracted.startswith("```json"):
            extracted = extracted.removeprefix("```json").removesuffix("```").strip()

        lineage = LineageResult.parse_raw(extracted)
    except Exception:
        lineage = LineageResult(source_tables=[], target_table="", column_mappings=[])

    result = lineage.dict()
    result["_raw"] = response.content
    result["_prompt"] = prompt
    result["hash"] = hash_string(content)
    result["procedure_name"] = proc_name
    result["database"] = database
    return result