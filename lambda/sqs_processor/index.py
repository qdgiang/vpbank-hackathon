import json
import logging
import os
import pymysql
import uuid
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Database connection parameters
DB_HOST = os.environ.get('DB_HOST')
DB_PORT = int(os.environ.get('DB_PORT', 3306))
DB_NAME = os.environ.get('DB_NAME')
DB_USER = os.environ.get('DB_USER')
DB_PASSWORD = os.environ.get('DB_PASSWORD')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process SQS messages containing transaction data
    """
    
    try:
        processed_records = []
        
        for record in event['Records']:
            # Extract message details
            message_id = record['messageId']
            body = record['body']
            
            # Parse the complete JSON transaction data from message body
            try:
                transaction_data = json.loads(body)
                logger.info(f"Processing transaction for user: {transaction_data.get('user_id')}")
                logger.info(f"Transaction data: {json.dumps(transaction_data, indent=2)}")
                
                # Validate required fields
                required_fields = ['user_id', 'amount', 'txn_time', 'msg_content', 'merchant', 'location', 'channel', 'tranx_type']
                missing_fields = [field for field in required_fields if field not in transaction_data]
                
                if missing_fields:
                    logger.warning(f"Missing required fields: {missing_fields}")
                    processed_records.append({
                        'messageId': message_id,
                        'status': 'failed',
                        'error': f'Missing required fields: {missing_fields}',
                        'transaction': transaction_data
                    })
                    continue
                
                # Process the transaction (add your business logic here)
                process_transaction(transaction_data)
                
                processed_records.append({
                    'messageId': message_id,
                    'status': 'processed',
                    'transaction': transaction_data
                })
                
            except json.JSONDecodeError as je:
                logger.error(f"Invalid JSON in message body: {body}. Error: {str(je)}")
                processed_records.append({
                    'messageId': message_id,
                    'status': 'failed',
                    'error': f'Invalid JSON: {str(je)}',
                    'raw_body': body
                })
                continue
            
        logger.info(f"Successfully processed {len(processed_records)} records")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {len(processed_records)} transactions',
                'processed_records': processed_records
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing SQS records: {str(e)}")
        raise e

def get_db_connection():
    """
    Create database connection
    """
    try:
        connection = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True
        )
        return connection
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        raise e

def process_transaction(transaction_data: Dict[str, Any]) -> None:
    """
    Insert transaction into database
    """
    
    user_id = transaction_data['user_id']
    amount = transaction_data['amount']
    merchant = transaction_data['merchant']
    tranx_type = transaction_data['tranx_type']
    
    logger.info(f"Processing {tranx_type} transaction: {amount} VND for user {user_id} at {merchant}")
    
    connection = None
    try:
        # Get database connection
        connection = get_db_connection()
        
        with connection.cursor() as cursor:
            # Generate transaction ID
            transaction_id = str(uuid.uuid4())
            
            # Insert transaction into database
            insert_query = """
                INSERT INTO transactions (
                    transaction_id, user_id, amount, txn_time, msg_content, merchant, 
                    location, channel, tranx_type, is_manual_override
                ) VALUES (
                    %(transaction_id)s, %(user_id)s, %(amount)s, %(txn_time)s, %(msg_content)s, %(merchant)s,
                    %(location)s, %(channel)s, %(tranx_type)s, %(is_manual_override)s
                )
            """
            
            # Parse txn_time string to datetime if needed
            txn_time = transaction_data['txn_time']
            if isinstance(txn_time, str):
                # Parse ISO format timestamp
                txn_time = datetime.fromisoformat(txn_time.replace('Z', '+00:00'))
            
            transaction_params = {
                'transaction_id': transaction_id,
                'user_id': user_id,
                'amount': float(amount),
                'txn_time': txn_time,
                'msg_content': transaction_data.get('msg_content'),
                'merchant': merchant,
                'location': transaction_data.get('location'),
                'channel': transaction_data.get('channel'),
                'tranx_type': tranx_type,
                'is_manual_override': True  # Since this comes from API
            }
            
            cursor.execute(insert_query, transaction_params)
            
            logger.info(f"Transaction inserted successfully with ID: {transaction_id}")
            logger.info(f"User {user_id}: {tranx_type} of {amount} VND at {merchant}")
            
            # Additional business logic can be added here:
            # - Update user balance
            # - Categorize transaction
            # - Send notifications
            # - Fraud detection
            # - Analytics
            
    except Exception as e:
        logger.error(f"Failed to insert transaction for user {user_id}: {str(e)}")
        raise e
    finally:
        if connection:
            connection.close()