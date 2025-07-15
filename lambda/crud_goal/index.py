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

def handler(event, context):
    path = event.get('path')
    method = event.get('httpMethod')

    try:
        if path == "/goals" and method == "GET":
            return get_goals(event)
        elif path.startswith("/goals/") and method == "GET":
            return get_goal_by_id(event)
        elif path == "/goals" and method == "POST":
            return create_goal(event)
        elif path.startswith("/goals/") and method == "PUT":
            return update_goal(event)
        elif path.startswith("/goals/") and method == "DELETE":
            return delete_goal(event)
        else:
            return response(404, {"error": "Not Found"})
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return response(500, {"error": str(e)})

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

    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM goal_setting WHERE goal_id = %s", (goal_id,))
        conn.commit()

    return response(200, {"message": "Goal deleted"})