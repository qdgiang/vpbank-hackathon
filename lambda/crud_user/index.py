import json
import os
import pymysql
import logging
from datetime import datetime
import uuid
import bcrypt

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
        if path == "/users" and method == "GET":
            return get_users(event)
        elif path.startswith("/users/") and method == "GET":
            return get_user_by_id(event)
        elif path == "/users" and method == "POST":
            return create_user(event)
        elif path.startswith("/users/") and method == "PUT":
            return update_user(event)
        elif path.startswith("/users/") and method == "DELETE":
            return delete_user(event)
        else:
            return response(404, {"error": "Not Found"})
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return response(500, {"error": str(e)})

def get_users(event):
    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT user_id, username, email, created_at, updated_at FROM users")
            rows = cursor.fetchall()
    return response(200, {"users": rows})

def get_user_by_id(event):
    user_id = event['pathParameters']['id']
    
    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT user_id, username, email, created_at, updated_at 
                FROM users WHERE user_id = %s
            """, (user_id,))
            row = cursor.fetchone()

    if not row:
        return response(404, {"error": "User not found"})
    return response(200, row)

def create_user(event):
    body = json.loads(event.get('body', '{}'))
    required_fields = ['username', 'email', 'password']
    for field in required_fields:
        if not body.get(field):
            return response(400, {"error": f"{field} is required"})

    user_id = str(uuid.uuid4())
    hashed_password = bcrypt.hashpw(body['password'].encode('utf-8'), bcrypt.gensalt())

    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO users (user_id, username, email, password_hash, created_at, updated_at)
                VALUES (%s, %s, %s, %s, NOW(), NOW())
            """, (user_id, body['username'], body['email'], hashed_password))
        conn.commit()

    return response(201, {"message": "User created", "user_id": user_id})

def update_user(event):
    user_id = event['pathParameters']['id']
    body = json.loads(event.get('body', '{}'))

    if not body:
        return response(400, {"error": "Empty update payload"})

    fields = []
    values = []
    for key in ["username", "email"]:
        if key in body:
            fields.append(f"{key} = %s")
            values.append(body[key])
    
    if "password" in body:
        hashed_password = bcrypt.hashpw(body['password'].encode('utf-8'), bcrypt.gensalt())
        fields.append("password_hash = %s")
        values.append(hashed_password)
    
    if not fields:
        return response(400, {"error": "No valid fields to update"})

    values.append(user_id)

    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute(f"""
                UPDATE users
                SET {', '.join(fields)}, updated_at = NOW()
                WHERE user_id = %s
            """, values)
        conn.commit()

    return response(200, {"message": "User updated"})

def delete_user(event):
    user_id = event['pathParameters']['id']

    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
        conn.commit()

    return response(200, {"message": "User deleted"})