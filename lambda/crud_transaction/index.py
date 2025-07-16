import json
import os
import pymysql
import logging
import boto3
LAMBDA_CLIENT = boto3.client('lambda')
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

def user_exists(user_id):
    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1 FROM users WHERE user_id = %s", (user_id,))
            return cursor.fetchone() is not None

def handler(event, context):
    path = event.get('path')
    method = event.get('httpMethod')

    try:
        # New endpoints
        if path == "/search" and method == "POST":
            return search_transactions(event)
        elif path == "/create" and method == "POST":
            return create_transaction(event, enhanced=True)
        elif path and path.endswith("/classify") and method == "PATCH":
            return classify_transaction(event)
        else:
            return response(404, {"error": "Not Found"})
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return response(500, {"error": str(e)})

# ---------------------- API Handlers ----------------------

def create_transaction(event, enhanced=False):
    body = json.loads(event.get('body', '{}'))
    required_fields = ['user_id', 'amount', 'txn_time']
    for field in required_fields:
        if not body.get(field):
            return response(400, {"error": f"{field} is required"})
    user_id = body['user_id']
    if not user_exists(user_id):
        return response(404, {"error": "User not found"})
    # Validate amount
    try:
        amount = float(body['amount'])
        if amount <= 0:
            return response(400, {"error": "amount must be positive"})
    except Exception:
        return response(400, {"error": "amount must be a number"})
    # Validate txn_time (optional: check format)
    import uuid
    transaction_id = str(uuid.uuid4())
    conn = get_db_connection()
    try:
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
                    amount,
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
    except Exception as e:
        logger.error(f"DB error: {str(e)}")
        return response(500, {"error": f"DB error: {str(e)}"})
    # No orchestration here: SQS processor will handle AI classify and jar update
    return response(201, {"message": "Transaction created", "transaction_id": transaction_id})

def search_transactions(event):
    body = json.loads(event.get('body', '{}'))
    user_id = body.get('user_id')
    pagination = body.get('pagination', {})
    filters = body.get('filters', {})
    search_text = body.get('search_text', '')
    if not user_id:
        return response(400, {"error": "user_id is required"})
    if not user_exists(user_id):
        return response(404, {"error": "User not found"})
    page_size = pagination.get('page_size', 20)
    current = pagination.get('current', 1)
    try:
        page_size = int(page_size)
        current = int(current)
        if page_size <= 0 or page_size > 100:
            return response(400, {"error": "page_size must be between 1 and 100"})
        if current <= 0:
            return response(400, {"error": "current must be positive"})
    except Exception:
        return response(400, {"error": "page_size and current must be integers"})
    offset = (current - 1) * page_size
    query = "SELECT * FROM transactions WHERE user_id = %s"
    params = [user_id]
    count_query = "SELECT COUNT(*) as total FROM transactions WHERE user_id = %s"
    count_params = [user_id]
    if filters.get('tranx_type'):
        query += " AND tranx_type = %s"
        params.append(filters['tranx_type'])
        count_query += " AND tranx_type = %s"
        count_params.append(filters['tranx_type'])
    if filters.get('category_label'):
        query += " AND category_label = %s"
        params.append(filters['category_label'])
        count_query += " AND category_label = %s"
        count_params.append(filters['category_label'])
    if filters.get('from_date'):
        query += " AND txn_time >= %s"
        params.append(filters['from_date'])
        count_query += " AND txn_time >= %s"
        count_params.append(filters['from_date'])
    if filters.get('to_date'):
        query += " AND txn_time <= %s"
        params.append(filters['to_date'])
        count_query += " AND txn_time <= %s"
        count_params.append(filters['to_date'])
    if search_text:
        query += " AND (msg_content LIKE %s OR merchant LIKE %s)"
        params.extend([f"%{search_text}%", f"%{search_text}%"])
        count_query += " AND (msg_content LIKE %s OR merchant LIKE %s)"
        count_params.extend([f"%{search_text}%", f"%{search_text}%"])
    query += " ORDER BY txn_time DESC LIMIT %s OFFSET %s"
    params.extend([page_size, offset])
    conn = get_db_connection()
    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute(query, tuple(params))
                rows = cursor.fetchall()
                cursor.execute(count_query, tuple(count_params))
                total = cursor.fetchone()['total']
    except Exception as e:
        logger.error(f"DB error: {str(e)}")
        return response(500, {"error": f"DB error: {str(e)}"})
    return response(200, {"transactions": rows, "total": total})

def classify_transaction(event):
    # PATCH /:id/classify
    transaction_id = event['pathParameters']['id']
    body = json.loads(event.get('body', '{}'))
    user_id = body.get('user_id')
    category_label = body.get('category_label')
    if not user_id or not category_label:
        return response(400, {"error": "user_id and category_label are required"})
    if not user_exists(user_id):
        return response(404, {"error": "User not found"})
    conn = get_db_connection()
    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1 FROM transactions WHERE transaction_id = %s AND user_id = %s", (transaction_id, user_id))
                exists = cursor.fetchone()
                if not exists:
                    return response(404, {"error": "Transaction not found"})
                cursor.execute("""
                    UPDATE transactions SET category_label = %s, updated_at = NOW()
                    WHERE transaction_id = %s AND user_id = %s
                """, (category_label, transaction_id, user_id))
            conn.commit()
    except Exception as e:
        logger.error(f"DB error: {str(e)}")
        return response(500, {"error": f"DB error: {str(e)}"})
    return response(200, {"message": "Transaction classified"})
