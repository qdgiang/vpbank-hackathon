import json
import os
import pymysql
import logging
from datetime import datetime
import re

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
    # Support both HTTP and direct Lambda invoke (for SQS processor)
    if 'action' in event:
        action = event['action']
        if action == 'update_jar_amount':
            return update_jar_amount(event)
        # ... (other possible actions in the future)
    path = event.get('path', '')
    method = event.get('httpMethod')
    
    try:
        if path.startswith("/jar/") and path.endswith("/initialize") and method == "POST":
            return initialize_jars(event)
        elif path.startswith("/jar/") and path.endswith("/percent") and method == "PUT":
            return update_jar_percent(event)
        elif path.startswith("/jar/") and method == "GET":
            return get_jar_list(event)
        elif path == "/jar/update_budget" and method == "POST":
            return update_jar_amount(event)
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
    if not user_exists(user_id):
        return response(404, {"error": "User not found"})
    
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
    required_fields = ['user_id']
    for field in required_fields:
        if not body.get(field):
            return response(400, {"error": f"{field} is required"})
    user_id = body['user_id']
    if not user_exists(user_id):
        return response(404, {"error": "User not found"})
    y_month = body.get('y_month')
    if y_month:
        # Validate format YYYY-MM
        if not re.match(r'^\d{4}-\d{2}$', y_month):
            return response(400, {"error": "y_month format must be YYYY-MM"})
        year, month = y_month.split('-')
        if not (1 <= int(month) <= 12):
            return response(400, {"error": "y_month month must be between 01 and 12"})
    else:
        from datetime import datetime
        y_month = datetime.now().strftime('%Y-%m')
    from datetime import datetime
    current_month = datetime.now().strftime('%Y-%m')
    if y_month < current_month:
        return response(400, {"error": "Cannot update or initialize JAR for past months"})
    income = body.get('income')
    jar_codes = ['NEC', 'FFA', 'LTSS', 'EDU', 'PLY', 'GIV']
    jar_percents = []
    percent_map = {}
    conn = get_db_connection()
    with conn:
        with conn.cursor() as cursor:
            income_type = body.get('income_type')
            if income_type is None:
                cursor.execute(
                    "SELECT income_type FROM user_jar_spending WHERE user_id = %s AND y_month < %s ORDER BY y_month DESC LIMIT 1",
                    (user_id, y_month)
                )
                row = cursor.fetchone()
                if row and row.get('income_type') is not None:
                    income_type = int(row['income_type'])
                else:
                    income_type = 0
            else:
                income_type = int(income_type)
            # Check if jars already exist for this user and y_month
            cursor.execute("""
                SELECT COUNT(*) as count FROM user_jar_spending 
                WHERE user_id = %s AND y_month = %s
            """, (user_id, y_month))
            result = cursor.fetchone()
            already_exists = result['count'] > 0
            # Lấy percent, income, remain tháng trước (1 truy vấn)
            cursor.execute("""
                SELECT y_month, jar_code, percent, virtual_budget_amount, spent_amount
                FROM user_jar_spending
                WHERE user_id = %s AND y_month < %s
                ORDER BY y_month DESC, jar_code
            """, (user_id, y_month))
            last_jars = cursor.fetchall()
            percent_map = {}
            last_y_month = None
            if last_jars:
                last_y_month = last_jars[0]['y_month']
                for jar in last_jars:
                    if jar['y_month'] == last_y_month:
                        percent_map[jar['jar_code']] = jar['percent']
                # Nếu income không truyền, lấy income tháng trước (tổng virtual_budget_amount)
                if income is None:
                    income = sum(jar['virtual_budget_amount'] for jar in last_jars if jar['y_month'] == last_y_month)
                # Nếu income_type == 1, cộng dồn remain
                if income_type == 1:
                    remain = sum((jar['virtual_budget_amount'] - jar['spent_amount']) for jar in last_jars if jar['y_month'] == last_y_month)
                    income = income + remain
            # Nếu không có percent tháng trước, gán mặc định
            if not percent_map:
                percent_map = {
                    'NEC': 55,
                    'GIV': 5,
                    'FFA': 10,
                    'LTSS': 10,
                    'EDU': 10,
                    'PLY': 10
                }
            jar_percents = [percent_map.get(jar_code, 0) for jar_code in jar_codes]
            # Nếu sau tất cả các bước income vẫn None, set income = 0
            if income is None:
                income = 0
            # Nếu chưa có jar tháng này, tạo mới
            if not already_exists:
                for jar_code, percent in zip(jar_codes, jar_percents):
                    percent = float(percent) if percent is not None else 0
                    virtual_budget_amount = float(income) * percent / 100
                    cursor.execute("""
                        INSERT INTO user_jar_spending (
                            user_id, y_month, jar_code, percent, 
                            virtual_budget_amount, spent_amount, income_type, created_at, updated_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    """, (user_id, y_month, jar_code, percent, virtual_budget_amount, 0, income_type))
            else:
                # Đã có jar tháng này, chỉ update virtual_budget_amount và income_type
                cursor.execute("""
                    SELECT jar_code, percent FROM user_jar_spending
                    WHERE user_id = %s AND y_month = %s
                """, (user_id, y_month))
                jars = cursor.fetchall()
                for jar in jars:
                    percent = float(jar['percent']) if jar['percent'] is not None else 0
                    virtual_budget_amount = float(income) * percent / 100
                    cursor.execute("""
                        UPDATE user_jar_spending SET virtual_budget_amount = %s, income_type = %s, updated_at = NOW()
                        WHERE user_id = %s AND y_month = %s AND jar_code = %s
                    """, (virtual_budget_amount, income_type, user_id, y_month, jar['jar_code']))
        conn.commit()
    return response(201, {
        "message": "Jars initialized successfully",
        "user_id": user_id,
        "y_month": y_month,
        "income": income,
        "income_type": income_type,
        "jar_codes": jar_codes,
        "percent_map": jar_percents
    })

def update_jar_percent(event):
    body = json.loads(event.get('body', '{}'))
    required_fields = ['user_id', 'jars']
    for field in required_fields:
        if not body.get(field):
            return response(400, {"error": f"{field} is required"})
    user_id = body['user_id']
    from datetime import datetime
    y_month = datetime.now().strftime('%Y-%m')
    jars = body['jars']
    income = body.get('income')
    if not isinstance(jars, list):
        return response(400, {"error": "jars must be an array"})
    if len(jars) != 6:
        return response(400, {"error": "Must provide exactly 6 jars"})
    total_percent = 0
    for jar in jars:
        percent = jar.get('percent')
        if percent is None:
            return response(400, {"error": "Each jar must have percent"})
        try:
            percent = float(percent)
        except Exception:
            return response(400, {"error": "Percent must be a number"})
        if percent < 0 or percent > 100:
            return response(400, {"error": "Percent must be between 0 and 100"})
        total_percent += percent
    if abs(total_percent - 100) > 1e-6:
        return response(400, {"error": "Total percent must be exactly 100"})
    conn = get_db_connection()
    try:
        with conn:
            with conn.cursor() as cursor:
                updated_jars = []
                for jar_data in jars:
                    jar_code = jar_data.get('jar_code')
                    percent = float(jar_data.get('percent', 0))
                    if not jar_code:
                        continue
                    # Race condition: update nếu đã có, nếu không thì insert
                    cursor.execute("""
                        SELECT COUNT(*) as count FROM user_jar_spending
                        WHERE user_id = %s AND y_month = %s AND jar_code = %s
                    """, (user_id, y_month, jar_code))
                    exists = cursor.fetchone()['count'] > 0
                    if exists:
                        if income is not None:
                            virtual_budget_amount = float(income) * percent / 100
                            cursor.execute("""
                                UPDATE user_jar_spending 
                                SET percent = %s, virtual_budget_amount = %s, updated_at = NOW()
                                WHERE user_id = %s AND y_month = %s AND jar_code = %s
                            """, (percent, virtual_budget_amount, user_id, y_month, jar_code))
                        else:
                            cursor.execute("""
                                UPDATE user_jar_spending 
                                SET percent = %s, updated_at = NOW()
                                WHERE user_id = %s AND y_month = %s AND jar_code = %s
                            """, (percent, user_id, y_month, jar_code))
                    else:
                        vba = float(income) * percent / 100 if income is not None else 0
                        cursor.execute("""
                            INSERT INTO user_jar_spending (
                                user_id, y_month, jar_code, percent, virtual_budget_amount, spent_amount, income_type, created_at, updated_at
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                        """, (user_id, y_month, jar_code, percent, vba, 0, 0))
                    updated_jars.append({"jar_code": jar_code, "percent": percent})
            conn.commit()
    except Exception as e:
        return response(500, {"error": f"DB error: {str(e)}"})
    return response(200, {
        "message": "Jar percentages updated successfully",
        "updated_jars": updated_jars,
        "total_percent": total_percent,
        "income": income
    })

def update_jar_amount(event):
    """
    Update spent_amount for the correct jar after transaction classification.
    Expects: user_id, amount, tranx_type, category_label (all required)
    """
    body = json.loads(event.get('body', '{}'))
    missing_fields = []
    user_id = body.get('user_id')
    if not user_id:
        missing_fields.append('user_id')
    amount = body.get('amount')
    if amount is None:
        missing_fields.append('amount')
    tranx_type = body.get('tranx_type')
    if not tranx_type:
        missing_fields.append('tranx_type')
    category_label = body.get('category_label')
    if not category_label:
        missing_fields.append('category_label')
    from datetime import datetime
    y_month = body.get('y_month') or datetime.now().strftime('%Y-%m')
    if missing_fields:
        logger.error(f"Missing required fields in update_jar_amount: {missing_fields}. Body: {body}")
        return response(400, {"error": f"Missing required fields: {', '.join(missing_fields)}", "body": body})
    if not user_exists(user_id):
        return response(404, {"error": "User not found", "user_id": user_id})
    # Map category_label to jar_code (default: category_label == jar_code, else NEC)
    jar_code = category_label.upper() if category_label.upper() in ['NEC','FFA','LTSS','EDU','PLY','GIV'] else 'NEC'
    # Only skip update for transfer_in, cashback, refund
    if tranx_type in ['transfer_in', 'cashback', 'refund']:
        return response(200, {"message": "No update needed for this transaction type", "jar_code": jar_code})
    # All other types: update spent_amount
    conn = get_db_connection()
    try:
        with conn:
            with conn.cursor() as cursor:
                # Update spent_amount for the correct jar
                cursor.execute("""
                    UPDATE user_jar_spending
                    SET spent_amount = spent_amount + %s, updated_at = NOW()
                    WHERE user_id = %s AND y_month = %s AND jar_code = %s
                """, (float(amount), user_id, y_month, jar_code))
            conn.commit()
    except Exception as e:
        logger.error(f"DB error: {str(e)}")
        return response(500, {"error": f"DB error: {str(e)}"})
    return response(200, {"message": "Jar spent_amount updated", "user_id": user_id, "y_month": y_month, "jar_code": jar_code, "amount": amount})