# backend/utils/hashing.py
import hashlib

def hash_string(text: str) -> str:
    """Generate a consistent SHA256 hash for caching or change detection."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()