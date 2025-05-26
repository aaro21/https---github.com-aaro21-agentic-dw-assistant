from cache_engine import get_cache_engine
from sqlalchemy import text

def test_connection():
    try:
        engine = get_cache_engine()
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 AS test_result"))
            for row in result:
                print("✅ Connection successful. Test result:", row.test_result)
    except Exception as e:
        print("❌ Connection failed:", str(e))

if __name__ == "__main__":
    test_connection()