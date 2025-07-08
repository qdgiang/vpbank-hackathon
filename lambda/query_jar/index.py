import json
import os
import pymysql
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Lambda function to query jars by user_id from the RDS MySQL database
    """
    try:
        # Database connection parameters from environment variables
        db_host = os.environ['DB_HOST']
        db_port = int(os.environ['DB_PORT'])
        db_name = os.environ['DB_NAME']
        db_user = os.environ['DB_USER']
        db_password = os.environ['DB_PASSWORD']
        
        logger.info(f"Attempting to connect to MySQL at {db_host}:{db_port}")
        
        # Get user_id from event
        user_id = event.get('user_id')
        
        if not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'user_id is required'
                })
            }
        
        # Connect to MySQL database
        connection = pymysql.connect(
            host=db_host,
            port=db_port,
            database=db_name,
            user=db_user,
            password=db_password
        )
        
        cursor = connection.cursor()
        
        # Query jars by user_id
        cursor.execute("SELECT * FROM jars WHERE user_id = %s", (user_id,))
        
        jars = cursor.fetchall()
        
        # Convert to list of lists
        jar_list = []
        for jar in jars:
            jar_row = []
            for value in jar:
                if hasattr(value, 'isoformat'):  # datetime objects
                    jar_row.append(value.isoformat())
                else:
                    jar_row.append(value)
            jar_list.append(jar_row)
        
        cursor.close()
        connection.close()
        
        logger.info(f"Successfully queried jars for user ID: {user_id}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Jars retrieved successfully',
                'jars': jar_list,
                'count': len(jar_list)
            })
        }
        
    except Exception as e:
        logger.error(f"Error in jar query Lambda: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }