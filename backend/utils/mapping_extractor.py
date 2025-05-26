# backend/utils/mapping_extractor.py

import sqlparse
import re
from typing import List, Dict, Tuple

def extract_temp_table_name(sql: str) -> str | None:
    match = re.search(r'INTO\s+(#\w+)', sql, re.IGNORECASE)
    return match.group(1) if match else None

def extract_select_mappings(sql: str) -> List[Tuple[str, str]]:
    pattern = re.compile(r'(\w+)\s+AS\s+(\w+)', re.IGNORECASE)
    return pattern.findall(sql)

def extract_insert_target(sql: str) -> str | None:
    match = re.search(r'INSERT\s+INTO\s+(\[?\w+\]?\.?\[?\w+\]?\.?\[?\w+\]?)', sql, re.IGNORECASE)
    return match.group(1) if match else None

def extract_merge_target(sql: str) -> Tuple[str, str] | None:
    match = re.search(r'MERGE\s+INTO\s+(\[?\w+\]?\.?\[?\w+\]?\.?\[?\w+\]?)\s+USING\s+(#\w+)', sql, re.IGNORECASE)
    return (match.group(1), match.group(2)) if match else None

def extract_select_star_from(sql: str) -> Tuple[str, str] | None:
    match = re.search(r'SELECT\s+\*\s+INTO\s+(#\w+)\s+FROM\s+([\[\]\w\.]+)', sql, re.IGNORECASE)
    return (match.group(2), match.group(1)) if match else None

def extract_procedure_mappings(sql: str) -> Dict:
    parsed = sqlparse.split(sql)
    source_table = None
    temp_table = None
    target_table = None
    mappings = []

    for stmt in parsed:
        stmt_lower = stmt.lower()

        if "select" in stmt_lower and "into" in stmt_lower and "from" in stmt_lower:
            if "*" in stmt_lower:
                star = extract_select_star_from(stmt)
                if star:
                    source_table, temp_table = star
                    mappings = [("*", "*")]
            else:
                temp_table = extract_temp_table_name(stmt)
                mappings = extract_select_mappings(stmt)
                match = re.search(r'FROM\s+([\[\]\w\.]+)', stmt, re.IGNORECASE)
                if match:
                    source_table = match.group(1)

        elif "insert into" in stmt_lower and (temp_table or "#" not in stmt_lower):
            target_table = extract_insert_target(stmt)

        elif "merge into" in stmt_lower and "using" in stmt_lower:
            result = extract_merge_target(stmt)
            if result:
                target_table, merge_temp = result
                if not temp_table:
                    temp_table = merge_temp

    return {
        "source_table": source_table,
        "temp_table": temp_table,
        "target_table": target_table,
        "column_mappings": mappings
    }