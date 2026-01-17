# database.py
import mysql.connector
from mysql.connector import Error

class Database:
    def __init__(self):
        self.config = {
            'host': 'localhost',
            'user': 'root',
            'password': '',
            'database': 'pmodoro_db'
        }
        self.conn = None
        self.init_db()
    
    def connect(self):
        try:
            self.conn = mysql.connector.connect(**self.config)
            print("Connected to MySQL database")
            return True
        except Error as e:
            print(f"Error connecting to MySQL: {e}")
            return False
    
    def init_db(self):
        """Initialize database and table"""
        try:
            # First connect without database
            temp_config = self.config.copy()
            temp_config.pop('database')
            
            conn = mysql.connector.connect(**temp_config)
            cursor = conn.cursor()
            
            # Create database if not exists
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {self.config['database']}")
            print(f"Database {self.config['database']} ready")
            
            # Use database
            cursor.execute(f"USE {self.config['database']}")
            
            # Create table
            create_table_query = """
            CREATE TABLE IF NOT EXISTS pmodoro_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                date VARCHAR(20) NOT NULL,
                start_time VARCHAR(10) NOT NULL,
                end_time VARCHAR(10) NOT NULL,
                mode VARCHAR(20) NOT NULL,
                task VARCHAR(255) NOT NULL,
                duration INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
            cursor.execute(create_table_query)
            print("Table pmodoro_history ready")
            
            conn.commit()
            cursor.close()
            conn.close()
            
            # Now connect with database
            return self.connect()
            
        except Error as e:
            print(f"Error initializing database: {e}")
            return False
    
    def save_session(self, session_data):
        try:
            cursor = self.conn.cursor()
            
            query = """
            INSERT INTO pmodoro_history 
            (date, start_time, end_time, mode, task, duration)
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            
            values = (
                session_data['date'],
                session_data['start_time'],
                session_data['end_time'],
                session_data['mode'],
                session_data['task'],
                session_data['duration']
            )
            
            cursor.execute(query, values)
            self.conn.commit()
            cursor.close()
            
            return {"success": True, "id": cursor.lastrowid}
            
        except Error as e:
            print(f"Error saving session: {e}")
            return {"success": False, "error": str(e)}
    
    def get_history(self, limit=100):
        try:
            cursor = self.conn.cursor(dictionary=True)
            
            query = """
            SELECT * FROM pmodoro_history 
            ORDER BY created_at DESC 
            LIMIT %s
            """
            
            cursor.execute(query, (limit,))
            results = cursor.fetchall()
            cursor.close()
            
            return results
            
        except Error as e:
            print(f"Error getting history: {e}")
            return []
    
    def get_total_hours(self):
        try:
            cursor = self.conn.cursor()
            
            query = "SELECT SUM(duration) FROM pmodoro_history"
            cursor.execute(query)
            total_minutes = cursor.fetchone()[0] or 0
            cursor.close()
            
            return total_minutes / 60
            
        except Error as e:
            print(f"Error calculating total hours: {e}")
            return 0
    
    def clear_history(self):
        try:
            cursor = self.conn.cursor()
            cursor.execute("DELETE FROM pmodoro_history")
            self.conn.commit()
            cursor.close()
            
            return {"success": True, "message": "All history deleted"}
            
        except Error as e:
            print(f"Error clearing history: {e}")
            return {"success": False, "error": str(e)}
    
    def close(self):
        if self.conn and self.conn.is_connected():
            self.conn.close()
            print("Database connection closed")

# Create global instance
db = Database()

# Function for backward compatibility
def init_database():
    """Initialize database (for main.py compatibility)"""
    return db.init_db()