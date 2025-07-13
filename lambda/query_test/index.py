import json
import os
import pymysql
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Lambda function to query the transactions table in the RDS MySQL database using pymysql
    """
    try:
        # Database connection parameters from environment variables
        db_host_raw = os.environ['DB_HOST']
        # Remove port from hostname if present (RDS endpoint format: hostname:port)
        db_host = db_host_raw.split(':')[0]
        db_port = int(os.environ['DB_PORT'])
        db_name = os.environ['DB_NAME']
        db_user = os.environ['DB_USER']
        db_password = os.environ['DB_PASSWORD']
        
        logger.info(f"Attempting to connect to MySQL at {db_host}:{db_port}")
        logger.info(f"Database: {db_name}, User: {db_user}")
        
        # Connect to MySQL database
        connection = pymysql.connect(
            host=db_host,
            port=db_port,
            database=db_name,
            user=db_user,
            password=db_password,
            cursorclass=pymysql.cursors.DictCursor
        )
        
        cursor = connection.cursor()
        
        table_name = 'transactions'
        
        # Check if transactions table exists in jarvis schema/database
        cursor.execute("""
            SELECT COUNT(*) as table_exists
            FROM information_schema.tables 
            WHERE table_schema = %s 
            AND table_name = %s
        """, (db_name, table_name))
        
        result = cursor.fetchone()
        table_exists = result['table_exists'] > 0
        
        if not table_exists:
            logger.info("Transactions table not found")
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'message': 'Transactions table not found in the database'
                })
            }
        
        # Get first 5 transactions from the table
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 5")
        data = cursor.fetchall()
        
        # Convert data to list of dictionaries with proper serialization
        transaction_records = []
        for row in data:
            record = {}
            for key, value in row.items():
                # Convert non-serializable types to strings
                if hasattr(value, 'isoformat'):  # datetime objects
                    record[key] = value.isoformat()
                elif isinstance(value, (int, float, str, bool)) or value is None:
                    record[key] = value
                else:
                    record[key] = str(value)
            transaction_records.append(record)
        
        cursor.close()
        connection.close()
        
        logger.info(f"Successfully queried first 5 transactions from {table_name} table")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully queried first 5 transactions from {table_name} table',
                'table_name': table_name,
                'count': len(transaction_records),
                'transactions': transaction_records
            })
        }
        
    except Exception as e:
        logger.error(f"Error in Lambda function: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }