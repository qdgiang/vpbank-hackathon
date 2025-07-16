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
        if path == "/notification/search" and method == "POST":
            return search_notifications(event)
        elif path == "/notification/create" and method == "POST":
            return create_notification(event)
        elif path and path.startswith("/notification/") and path.endswith("/status") and method == "PATCH":
            return mark_notification_status(event)
        else:
            return response(404, {"error": "Not Found"})
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return response(500, {"error": str(e)})

# ---------------------- API Handlers ----------------------
def search_notifications(event):
    body = json.loads(event.get('body', '{}'))
    user_id = body.get('user_id')
    pagination = body.get('pagination', {})
    filters = body.get('filters', {})
    if not user_id:
        return response(400, {"error": "user_id is required"})
    if not user_exists(user_id):
        return response(404, {"error": "User not found"})
    page_size = pagination.get('page_size', 20)
    current = pagination.get('current', 1)
    offset = (current - 1) * page_size
    # Build query for data
    query = "SELECT * FROM notifications WHERE user_id = %s"
    params = [user_id]
    # Build query for count
    count_query = "SELECT COUNT(*) as total FROM notifications WHERE user_id = %s"
    count_params = [user_id]
    if filters.get('status'):
        query += " AND status = %s"
        params.append(filters['status'])
        count_query += " AND status = %s"
        count_params.append(filters['status'])
    if filters.get('object_code'):
        query += " AND object_code = %s"
        params.append(filters['object_code'])
        count_query += " AND object_code = %s"
        count_params.append(filters['object_code'])
    if filters.get('from_date'):
        query += " AND created_at >= %s"
        params.append(filters['from_date'])
        count_query += " AND created_at >= %s"
        count_params.append(filters['from_date'])
    if filters.get('to_date'):
        query += " AND created_at <= %s"
        params.append(filters['to_date'])
        count_query += " AND created_at <= %s"
        count_params.append(filters['to_date'])
    query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
    params.extend([page_size, offset])
    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()
            cursor.execute(count_query, tuple(count_params))
            total = cursor.fetchone()['total']
    return response(200, {"notifications": rows, "total": total})

def create_notification(event):
    body = json.loads(event.get('body', '{}'))
    required_fields = ['user_id', 'title', 'message', 'notification_type', 'severity', 'object_code', 'object_id']
    for field in required_fields:
        if not body.get(field):
            return response(400, {"error": f"{field} is required"})
    user_id = body['user_id']
    if not user_exists(user_id):
        return response(404, {"error": "User not found"})
    import uuid
    notification_id = str(uuid.uuid4())
    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO notifications (
                    notification_id, user_id, title, message, notification_type, severity, object_code, object_id, status, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """, (
                notification_id,
                user_id,
                body['title'],
                body['message'],
                body['notification_type'],
                body['severity'],
                body['object_code'],
                body['object_id'],
                body.get('status', 'unread')
            ))
        conn.commit()
    return response(201, {"message": "Notification created", "notification_id": notification_id})

def mark_notification_status(event):
    # PATCH /notification/:id/status
    path = event.get('path')
    notification_id = path.split("/")[2] if path else None
    body = json.loads(event.get('body', '{}'))
    user_id = body.get('user_id')
    status = body.get('status')
    if not notification_id or not user_id or not status:
        return response(400, {"error": "notification_id, user_id, and status are required"})
    if not user_exists(user_id):
        return response(404, {"error": "User not found"})
    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE notifications SET status = %s, updated_at = NOW()
                WHERE notification_id = %s AND user_id = %s
            """, (status, notification_id, user_id))
        conn.commit()
    return response(200, {"message": "Notification status updated"})
