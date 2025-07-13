import json
import os
import pymysql
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def response(status, body):
    return {
        'statusCode': status,
        'body': json.dumps(body, default=str),
        'headers': {'Content-Type': 'application/json'}
    }

def get_db_connection():
    return pymysql.connect(
        host=os.environ['DB_HOST'],
        port=int(os.environ['DB_PORT']),
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD'],
        database=os.environ['DB_NAME'],
        cursorclass=pymysql.cursors.DictCursor
    )

def handler(event, context):
    path = event.get('path')
    method = event.get('httpMethod')

    try:
        if path == "/transactions" and method == "GET":
            return get_transactions(event)
        elif path.startswith("/transactions/") and method == "GET":
            return get_transaction_by_id(event)
        elif path == "/transactions" and method == "POST":
            return create_transaction(event)
        elif path.startswith("/transactions/") and method == "PUT":
            return update_transaction(event)
        elif path.startswith("/transactions/") and method == "DELETE":
            return delete_transaction(event)
        else:
            return response(404, {"error": "Not Found"})
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return response(500, {"error": str(e)})

# ---------------------- API Handlers ----------------------

def get_transactions(event):
    user_id = event['queryStringParameters'].get('user_id')
    if not user_id:
        return response(400, {"error": "user_id is required"})

    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT * FROM transactions
                WHERE user_id = %s
                ORDER BY txn_time DESC
            """, (user_id,))
            rows = cursor.fetchall()
    return response(200, {"transactions": rows})

def get_transaction_by_id(event):
    transaction_id = event['pathParameters']['id']

    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT * FROM transactions WHERE transaction_id = %s
            """, (transaction_id,))
            row = cursor.fetchone()

    if not row:
        return response(404, {"error": "Transaction not found"})
    return response(200, row)

def create_transaction(event):
    body = json.loads(event.get('body', '{}'))
    required_fields = ['user_id', 'amount', 'txn_time']
    for field in required_fields:
        if not body.get(field):
            return response(400, {"error": f"{field} is required"})

    import uuid
    transaction_id = str(uuid.uuid4())

    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO transactions (
                    transaction_id, user_id, amount, txn_time, msg_content,
                    merchant, to_account_name, location, channel,
                    tranx_type, category_label, is_manual_override,
                    created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """, (
                transaction_id,
                body['user_id'],
                body['amount'],
                body['txn_time'],
                body.get('msg_content'),
                body.get('merchant'),
                body.get('to_account_name'),
                body.get('location'),
                body.get('channel'),
                body.get('tranx_type'),
                body.get('category_label'),
                body.get('is_manual_override', False)
            ))
        conn.commit()

    return response(201, {"message": "Transaction created", "transaction_id": transaction_id})

def update_transaction(event):
    transaction_id = event['pathParameters']['id']
    body = json.loads(event.get('body', '{}'))

    if not body:
        return response(400, {"error": "Empty update payload"})

    fields = []
    values = []
    for key in ["category_label", "tranx_type", "merchant", "is_manual_override"]:
        if key in body:
            fields.append(f"{key} = %s")
            values.append(body[key])
    if not fields:
        return response(400, {"error": "No valid fields to update"})

    values.append(transaction_id)

    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute(f"""
                UPDATE transactions
                SET {', '.join(fields)}, updated_at = NOW()
                WHERE transaction_id = %s
            """, values)
        conn.commit()

    return response(200, {"message": "Transaction updated"})

def delete_transaction(event):
    transaction_id = event['pathParameters']['id']

    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM transactions WHERE transaction_id = %s", (transaction_id,))
        conn.commit()

    return response(200, {"message": "Transaction deleted"})
