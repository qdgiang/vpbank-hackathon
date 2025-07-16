import json
import os
import pymysql
import logging
from datetime import datetime
import uuid

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
        if path == "/goal/search" and method == "POST":
            return search_goals(event)
        elif path == "/goal/create" and method == "POST":
            return create_goal(event)
        elif path and path.startswith("/goal/") and method == "PUT":
            return update_goal(event)
        elif path and path.startswith("/goal/") and method == "DELETE":
            return delete_goal(event)
        else:
            return response(404, {"error": "Not Found"})
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return response(500, {"error": str(e)})

# Chuẩn hóa: POST /goal/search
# Body: {user_id, pagination {page_size, current}, filters {status, from_date, to_date, goal_type, priority_level}, search_text}
def search_goals(event):
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
    offset = (current - 1) * page_size
    query = "SELECT * FROM goal_setting WHERE user_id = %s"
    params = [user_id]
    count_query = "SELECT COUNT(*) as total FROM goal_setting WHERE user_id = %s"
    count_params = [user_id]
    # Filter
    if filters.get('status'):
        query += " AND status = %s"
        params.append(filters['status'])
        count_query += " AND status = %s"
        count_params.append(filters['status'])
    if filters.get('goal_type'):
        query += " AND goal_type = %s"
        params.append(filters['goal_type'])
        count_query += " AND goal_type = %s"
        count_params.append(filters['goal_type'])
    if filters.get('priority_level'):
        query += " AND priority_level = %s"
        params.append(filters['priority_level'])
        count_query += " AND priority_level = %s"
        count_params.append(filters['priority_level'])
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
    if search_text:
        query += " AND (goal_name LIKE %s OR description LIKE %s)"
        params.extend([f"%{search_text}%", f"%{search_text}%"])
        count_query += " AND (goal_name LIKE %s OR description LIKE %s)"
        count_params.extend([f"%{search_text}%", f"%{search_text}%"])
    query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
    params.extend([page_size, offset])
    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()
            cursor.execute(count_query, tuple(count_params))
            total = cursor.fetchone()['total']
    return response(200, {"goals": rows, "total": total})

def get_goals(event):
    user_id = event['queryStringParameters'].get('user_id')
    if not user_id:
        return response(400, {"error": "user_id is required"})

    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT * FROM goal_setting
                WHERE user_id = %s
                ORDER BY created_at DESC
            """, (user_id,))
            rows = cursor.fetchall()
    return response(200, {"goals": rows})

def get_goal_by_id(event):
    goal_id = event['pathParameters']['id']

    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT * FROM goal_setting WHERE goal_id = %s
            """, (goal_id,))
            row = cursor.fetchone()

    if not row:
        return response(404, {"error": "Goal not found"})
    return response(200, row)

def create_goal(event):
    body = json.loads(event.get('body', '{}'))
    required_fields = ['user_id', 'goal_name', 'target_amount', 'target_date']
    for field in required_fields:
        if not body.get(field):
            return response(400, {"error": f"{field} is required"})
    if not user_exists(body['user_id']):
        return response(404, {"error": "User not found"})

    goal_id = str(uuid.uuid4())

    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO goal_setting (
                    goal_id, user_id, goal_name, target_amount, target_date,
                    current_amount, status, description, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """, (
                goal_id,
                body['user_id'],
                body['goal_name'],
                body['target_amount'],
                body['target_date'],
                body.get('current_amount', 0),
                body.get('status', 'active'),
                body.get('description')
            ))
        conn.commit()

    return response(201, {"message": "Goal created", "goal_id": goal_id})

def update_goal(event):
    goal_id = event['pathParameters']['id']
    body = json.loads(event.get('body', '{}'))

    if not body:
        return response(400, {"error": "Empty update payload"})

    user_id = body.get('user_id')
    if not user_id:
        return response(400, {"error": "user_id is required"})
    if not user_exists(user_id):
        return response(404, {"error": "User not found"})

    fields = []
    values = []
    for key in ["goal_name", "target_amount", "target_date", "current_amount", "status", "description"]:
        if key in body:
            fields.append(f"{key} = %s")
            values.append(body[key])
    
    if not fields:
        return response(400, {"error": "No valid fields to update"})

    values.append(goal_id)

    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute(f"""
                UPDATE goal_setting
                SET {', '.join(fields)}, updated_at = NOW()
                WHERE goal_id = %s
            """, values)
        conn.commit()

    return response(200, {"message": "Goal updated"})

def delete_goal(event):
    goal_id = event['pathParameters']['id']
    body = json.loads(event.get('body', '{}')) if event.get('body') else {}
    user_id = body.get('user_id')
    if not user_id:
        return response(400, {"error": "user_id is required"})
    if not user_exists(user_id):
        return response(404, {"error": "User not found"})

    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM goal_setting WHERE goal_id = %s", (goal_id,))
        conn.commit()

    return response(200, {"message": "Goal deleted"})