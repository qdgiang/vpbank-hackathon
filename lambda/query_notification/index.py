import json
import os
import pymysql
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Lambda function to query unread notifications by user_id from the RDS MySQL database
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
        
        # Query unread notifications by user_id
        cursor.execute("SELECT * FROM notifications WHERE user_id = %s AND is_read = 0", (user_id,))
        
        notifications = cursor.fetchall()
        
        # Convert to list of lists
        notifications_list = []
        for row in notifications:
            notification_row = []
            for value in row:
                if hasattr(value, 'isoformat'):  # datetime objects
                    notification_row.append(value.isoformat())
                else:
                    notification_row.append(value)
            notifications_list.append(notification_row)
        
        cursor.close()
        connection.close()
        
        logger.info(f"Successfully queried unread notifications for user ID: {user_id}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Unread notifications retrieved successfully',
                'notifications': notifications_list,
                'count': len(notifications_list)
            })
        }
        
    except Exception as e:
        logger.error(f"Error in notifications Lambda: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }