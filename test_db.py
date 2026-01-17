# test_db.py
from database import db

# Test koneksi
print("Testing database connection...")
if db.conn and db.conn.is_connected():
    print("✓ Database connected successfully")
    
    # Test query
    cursor = db.conn.cursor()
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    print(f"✓ Tables in database: {tables}")
    
    # Test count
    cursor.execute("SELECT COUNT(*) FROM pmodoro_history")
    count = cursor.fetchone()[0]
    print(f"✓ Total records in history: {count}")
    
    cursor.close()
    db.close()
    print("✓ Database connection closed")
else:
    print("✗ Database connection failed")