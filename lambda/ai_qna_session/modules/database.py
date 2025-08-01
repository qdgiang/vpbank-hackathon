import os
import pymysql
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

DB_HOST_RAW = os.environ.get("DB_HOST", "127.0.0.1")
DB_HOST = DB_HOST_RAW.split(":")[0]
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
DB_NAME = os.environ.get("DB_NAME", 'testdb')
DB_PORT = int(os.environ.get('DB_PORT', 3307))

# Global variable for the database connection
db_connection = None

def get_db_connection():
    """
    Establishes a connection to the MySQL database if one doesn't exist.
    Returns the existing connection.
    """
    global db_connection
    if db_connection is None or not db_connection.open:
        try:
            logger.info("Connecting to database...")
            db_connection = pymysql.connect(
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASSWORD,
                db=DB_NAME,
                port=DB_PORT,
                connect_timeout=5,
                cursorclass=pymysql.cursors.DictCursor
            )
            logger.info("Database connection successful.")
        except pymysql.MySQLError as e:
            logger.error("ERROR: Unexpected error: Could not connect to MySQL instance.")
            logger.error(e)
            raise e
    return db_connection

def execute_sql(query: str, user_id: str) -> List[Dict[str, Any]]:
    if 'user_id' not in query.lower() or f"'{user_id}'" not in query and f'"{user_id}"' not in query and f"= %s" not in query:
        logger.warning(f"Security check failed: 'user_id' filter missing or incorrect in query: {query}")
        raise ValueError("Query must include a 'user_id' filter.")

    conn = get_db_connection()
    results = []
    try:
        with conn.cursor() as cursor:
            logger.info(f"Executing SQL for user '{user_id}': {query}")
            cursor.execute(query, (user_id,))
            results = cursor.fetchall()
            logger.info(f"Query returned {len(results)} rows.")
    except pymysql.MySQLError as e:
        logger.error(f"Error executing SQL for user {user_id}: {e}")
        global db_connection
        db_connection = None
        raise e

    return results
