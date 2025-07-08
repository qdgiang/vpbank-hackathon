import json
import os
import pymysql
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Lambda function to query a user by user_id from the RDS MySQL database
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
            password=db_password,
            cursorclass=pymysql.cursors.DictCursor
        )
        
        cursor = connection.cursor()
        
        # Query user by user_id
        cursor.execute("SELECT id, email, name, created_at FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'message': 'User not found'
                })
            }
        
        # Convert datetime objects to strings
        if user.get('created_at'):
            user['created_at'] = user['created_at'].isoformat()
        
        cursor.close()
        connection.close()
        
        logger.info(f"Successfully queried user with ID: {user_id}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'User retrieved successfully',
                'user': user
            })
        }
        
    except Exception as e:
        logger.error(f"Error in user query Lambda: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }