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
    path = event.get('path', '')
    method = event.get('httpMethod')
    
    try:
        if path.startswith("/jar/") and path.endswith("/initialize") and method == "POST":
            return initialize_jars(event)
        elif path.startswith("/jar/") and path.endswith("/percent") and method == "PUT":
            return update_jar_percent(event)
        elif path.startswith("/jar/") and method == "GET":
            return get_jar_list(event)
        else:
            return response(404, {"error": "Not Found"})
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return response(500, {"error": str(e)})

def get_jar_list(event):
    """GET /jar/:id?y_month - Get jar list by user_id and optional y_month"""
    user_id = event['pathParameters'].get('id')
    y_month = event.get('queryStringParameters', {}).get('y_month') if event.get('queryStringParameters') else None
    
    if not user_id:
        return response(400, {"error": "user_id is required"})
    
    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            if y_month:
                cursor.execute("""
                    SELECT * FROM user_jar_spending 
                    WHERE user_id = %s AND y_month = %s
                    ORDER BY jar_code
                """, (user_id, y_month))
            else:
                cursor.execute("""
                    SELECT * FROM user_jar_spending 
                    WHERE user_id = %s
                    ORDER BY y_month DESC, jar_code
                """, (user_id,))
            
            jars = cursor.fetchall()
    
    return response(200, {"jars": jars, "count": len(jars)})

def initialize_jars(event):
    """POST /jar/initialize - Initialize jar budgets for a user"""
    body = json.loads(event.get('body', '{}'))
    
    required_fields = ['user_id', 'income']
    for field in required_fields:
        if not body.get(field):
            return response(400, {"error": f"{field} is required"})
    
    user_id = body['user_id']
    income = body['income']
    y_month = datetime.now().strftime('%Y-%m')  # Auto-detect current year-month
    
    # Standard jar codes with 0% allocation initially
    jar_codes = ['NEC', 'FFA', 'LTSS', 'EDU', 'PLY', 'GIV']
    
    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            # Check if jars already exist for this user and y_month
            cursor.execute("""
                SELECT COUNT(*) as count FROM user_jar_spending 
                WHERE user_id = %s AND y_month = %s
            """, (user_id, y_month))
            
            result = cursor.fetchone()
            if result['count'] > 0:
                return response(400, {"error": f"Jars already initialized for {y_month}"})
            
            # Insert initial jar records
            for jar_code in jar_codes:
                cursor.execute("""
                    INSERT INTO user_jar_spending (
                        user_id, y_month, jar_code, budget_percent, 
                        budget_amount, spent_amount, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                """, (user_id, y_month, jar_code, 0, 0, 0))
        
        conn.commit()
    
    return response(201, {
        "message": "Jars initialized successfully",
        "user_id": user_id,
        "y_month": y_month,
        "income": income,
        "jar_codes": jar_codes
    })

def update_jar_percent(event):
    """PUT /jar/percent - Update jar percentages"""
    body = json.loads(event.get('body', '{}'))
    
    required_fields = ['user_id', 'y_month', 'jars']
    for field in required_fields:
        if not body.get(field):
            return response(400, {"error": f"{field} is required"})
    
    user_id = body['user_id']
    y_month = body['y_month']
    jars = body['jars']
    
    if not isinstance(jars, list):
        return response(400, {"error": "jars must be an array"})
    
    # Validate total percentage doesn't exceed 100%
    total_percent = sum(jar.get('percent', 0) for jar in jars)
    if total_percent > 100:
        return response(400, {"error": f"Total percentage ({total_percent}%) cannot exceed 100%"})
    
    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            updated_jars = []
            
            for jar_data in jars:
                jar_code = jar_data.get('jar_code')
                percent = jar_data.get('percent', 0)
                
                if not jar_code:
                    continue
                
                # Get current income to calculate budget_amount
                cursor.execute("""
                    SELECT budget_amount FROM user_jar_spending 
                    WHERE user_id = %s AND y_month = %s AND jar_code = %s
                """, (user_id, y_month, jar_code))
                
                current_row = cursor.fetchone()
                if not current_row:
                    continue
                
                # Calculate new budget amount based on percentage
                # Note: You might want to store total income separately to calculate this properly
                # For now, we'll update just the percentage
                cursor.execute("""
                    UPDATE user_jar_spending 
                    SET budget_percent = %s, updated_at = NOW()
                    WHERE user_id = %s AND y_month = %s AND jar_code = %s
                """, (percent, user_id, y_month, jar_code))
                
                updated_jars.append({"jar_code": jar_code, "percent": percent})
        
        conn.commit()
    
    return response(200, {
        "message": "Jar percentages updated successfully",
        "updated_jars": updated_jars,
        "total_percent": total_percent
    })