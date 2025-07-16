import json
import os
import pymysql
import logging
from datetime import datetime, date
import uuid
from decimal import Decimal
from dateutil.relativedelta import relativedelta

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

def lambda_handler(event, context):
    logger.info(f"Incoming event: {json.dumps(event)}")

    path = event.get('path', '')
    method = event.get('httpMethod', '').upper()

    try:
        if path == "/goal/search" and method == "POST":
            return search_goals(event)

        elif path == "/goal/set" and method == "POST":
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            data = body.get('data')
            if not user_id or not data:
                return response(400, {"error": "Missing user_id or data"})
            return response(200, set_goal(user_id, data))

        elif path == "/goal/allocate" and method == "POST":
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            amount = body.get('sent_amount')
            if not user_id or amount is None:
                return response(400, {"error": "Missing user_id or sent_amount"})
            return response(200, allocate_saving(user_id, amount))

        elif path.startswith("/goal/pause/") and method == "PUT":
            goal_id = path.split("/goal/pause/")[1]
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            if not user_id or not goal_id:
                return response(400, {"error": "Missing user_id or goal_id"})
            return response(200, pause_goal(goal_id, user_id))

        elif path.startswith("/goal/delete/") and method == "DELETE":
            goal_id = path.split("/goal/delete/")[1]
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            if not user_id or not goal_id:
                return response(400, {"error": "Missing user_id or goal_id"})
            return response(200, delete_goal(goal_id, user_id))

        else:
            return response(404, {"error": "Not Found"})

    except Exception as e:
        logger.exception("Unhandled error in handler")
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

# set_goal function
BASE_WEIGHT_POOL = {1: 50, 2: 30, 3: 20}
TIER_UNIT_WEIGHTS = {1: 5, 2: 3, 3: 2}
RATE = 1.02 ** (1 / 12) - 1
def calculate_eta(target, current, monthly):
    target, current, monthly = float(target), float(current), float(monthly)
    if monthly <= 0: return None
    for n in range(1, 600):
        factor = pow(1 + RATE, n)
        fv = current * factor + monthly * (factor - 1) / RATE
        if fv >= target:
            return n
    return None

def set_goal(user_id, data):
    total_monthly_amount = Decimal(data.get("total_monthly_amount", 0))
    new_goals = data.get("goals", [])

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("SELECT * FROM saving_goals WHERE user_id = %s AND status = 1", (user_id,))
        existing_goals = cur.fetchall()

        if len(existing_goals) + len(new_goals) > 5:
            return {"status": "error", "message": "Cannot have more than 5 active goals."}

        now = datetime.now()

        locked, unlocked = [], []
        for g in existing_goals:
            if g['eta_lock']:
                locked.append(g)
            else:
                unlocked.append(g)

        locked_total = sum(Decimal(g['month_req']) for g in locked)
        remaining = total_monthly_amount - locked_total

        if remaining < 0:
            return {"status": "error", "message": "Monthly amount too small to satisfy locked goals."}

        all_unlocked = unlocked + new_goals

        pri_map = {1: [], 2: [], 3: []}
        for g in all_unlocked:
            pri_map[int(g['priority_level'])].append(g)

        tier_limits = {1: 1, 2: 2, 3: 2}
        total_base = 0
        for level in [1, 2, 3]:
            actual = len(pri_map[level])
            allowed = tier_limits[level]
            total_base += Decimal(BASE_WEIGHT_POOL[level]) * Decimal(min(actual, allowed)) / Decimal(allowed)

        present_weights = []
        for level in [1, 2, 3]:
            if pri_map[level]:
                base_weight = Decimal(BASE_WEIGHT_POOL[level]) / tier_limits[level]
                for g in pri_map[level]:
                    present_weights.append((g, base_weight))

        total_present_weight = sum(w for _, w in present_weights)

        locked_weight = locked_total / total_monthly_amount if total_monthly_amount > 0 else Decimal(0)
        unlocked_weight_budget = Decimal(1) - locked_weight

        # Redistribute weights (do not normalize further)
        redistributed = [(g, unlocked_weight_budget * (w / total_present_weight)) for g, w in present_weights]

        # Build weight_map once
        weight_map = {}
        for g, w in redistributed:
            key = g['goal_id'] if 'goal_id' in g else g['goal_name']
            weight_map[key] = w

        responses = []
        for g in new_goals:
            gid = str(datetime.timestamp(now)) + g['goal_name'][:5]
            tgt_amt = Decimal(g['target_amount'])
            key = g['goal_id'] if 'goal_id' in g else g['goal_name']
            weight = weight_map[key]
            month_req = round(remaining * weight, 2)
            eta_months = calculate_eta(tgt_amt, 0, month_req)
            target_date = (now + relativedelta(months=+eta_months)).replace(day=1) if eta_months else None

            cur.execute("""
                INSERT INTO saving_goals (
                    goal_id, user_id, goal_name, target_amount, current_amount,
                    target_date, goal_type, priority_level, weight, status,
                    eta_lock, initial_target_date, sent_money, month_req,
                    created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, 0.00,
                    %s, %s, %s, %s, 1,
                    %s, %s, FALSE, %s,
                    %s, %s
                )
            """, (
                gid, user_id, g['goal_name'], tgt_amt,
                target_date.date(), g['goal_type'], int(g['priority_level']),
                round(weight, 5), bool(g['eta_lock']), target_date.date(), month_req,
                now, now
            ))
            responses.append({
                "goal_id": gid,
                "goal_name": g['goal_name'],
                "month_req": float(month_req),
                "weight": float(weight)
            })

        for g in unlocked:
            gid = g['goal_id']
            tgt_amt = Decimal(g['target_amount'])
            key = gid
            weight = weight_map[key]
            month_req = round(remaining * weight, 2)
            eta_months = calculate_eta(tgt_amt, Decimal(g['current_amount']), month_req)
            target_date = (start_date + relativedelta(months=+eta_months)).replace(day=1) if eta_months else None

            cur.execute("""
                UPDATE saving_goals
                   SET weight = %s, month_req = %s, target_date = %s, updated_at = %s
                 WHERE goal_id = %s
            """, (round(weight, 5), month_req, target_date.date(), now, gid))

        conn.commit()
        return {"status": "success", "message": "Goals updated."}

    except Exception as e:
        conn.rollback()
        logger.exception("Unhandled exception in set_goal")
        return {"status": "error", "message": str(e)}

    finally:
        cur.close()
        conn.close()





#allocate_saving function
def calc_eta(target, current, monthly, rate):
    if monthly <= 0:
        return None
    target, current, monthly = Decimal(target), Decimal(current), Decimal(monthly)
    n = 0
    while n < 600:
        factor = (1 + rate) ** n
        annuity = ((factor - 1) / rate) * (1 / (1 + rate))
        fv = current * factor + monthly * annuity
        if fv >= target:
            return n
        n += 1
    return None

def calc_month_req(target, current, months, rate):
    if months <= 0:
        return Decimal('0.00')
    target, current = Decimal(target), Decimal(current)
    factor = (1 + rate) ** months
    fv_current = current * factor
    if fv_current >= target:
        return Decimal('0.00')
    numerator = target - fv_current
    denominator = (factor - 1) / rate
    return (numerator / denominator).quantize(Decimal('0.01'))

def allocate_saving(user_id, sent_amount):
    rate = Decimal(str(1.02 ** (1 / 12) - 1))
    now = datetime.now()
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT goal_id, target_amount, current_amount, target_date, initial_target_date,
                   weight, month_req, eta_lock
              FROM saving_goals
             WHERE user_id = %s AND status = 1 AND sent_money = 0
        """, (user_id,))
        goals = cur.fetchall()

        if not goals:
            return {"status": "success", "message": "No active goals pending allocation."}

        total_required = sum(Decimal(g["month_req"] or 0) for g in goals)
        sent_amount = Decimal(sent_amount)
        allocation = []

        if sent_amount >= total_required:
            # No deficit: pay all, distribute surplus
            remaining = sent_amount
            for g in goals:
                amt = Decimal(g["month_req"] or 0)
                g["current_amount"] += amt
                remaining -= amt
                allocation.append((g["goal_id"], amt))

            if remaining > 0:
                total_weight = sum(float(g["weight"] or 0) for g in goals)
                for g in goals:
                    extra = remaining * Decimal(g["weight"] or 0) / Decimal(total_weight)
                    g["current_amount"] += extra
                    allocation.append((g["goal_id"], extra))

        else:
            # Deficit: distribute by weight
            total_weight = sum(float(g["weight"] or 0) for g in goals)
            for g in goals:
                weight = Decimal(g["weight"] or 0)
                portion = sent_amount * weight / Decimal(total_weight)
                g["current_amount"] += portion
                allocation.append((g["goal_id"], portion))

        # Recalculate month_req or target_date based on updated current_amount
        for g in goals:
            target = Decimal(g["target_amount"])
            current = Decimal(g["current_amount"])
            if g["eta_lock"]:
                months = (g["target_date"].replace(day=1) - date.today().replace(day=1)).days // 30
                new_month_req = calc_month_req(target, current, months, rate)
                g["month_req"] = new_month_req
                cur.execute("""
                    UPDATE saving_goals
                       SET month_req = %s, updated_at = %s
                     WHERE goal_id = %s
                """, (new_month_req, now, g["goal_id"]))
            else:
                monthly = Decimal(g["month_req"] or 0)
                eta = calc_eta(target, current, monthly, rate)
                if eta:
                    new_target = date.today() + relativedelta(months=eta)
                    g["target_date"] = new_target
                    cur.execute("""
                        UPDATE saving_goals
                           SET target_date = %s, updated_at = %s
                         WHERE goal_id = %s
                    """, (new_target, now, g["goal_id"]))

        # Recalculate weights based on month_req
        total_month_req = sum(Decimal(g["month_req"] or 0) for g in goals)
        for g in goals:
            new_weight = Decimal(g["month_req"] or 0) / total_month_req if total_month_req > 0 else 0
            cur.execute("""
                UPDATE saving_goals
                   SET weight = %s, updated_at = %s
                 WHERE goal_id = %s
            """, (new_weight, now, g["goal_id"]))

        # Final update: current_amount and sent_money
        for gid, added in allocation:
            cur.execute("""
                UPDATE saving_goals
                   SET current_amount = current_amount + %s,
                       sent_money = 1,
                       updated_at = %s
                 WHERE goal_id = %s
            """, (added, now, gid))

        conn.commit()
        return {
            "status": "success",
            "message": f"Allocated {float(sent_amount)} across {len(goals)} goals."
        }

    except Exception as e:
        conn.rollback()
        logger.exception("Error during allocation")
        return {"status": "error", "message": str(e)}
    finally:
        cur.close()
        conn.close()

#delete_goal function
def delete_goal(goal_id, user_id):
    rate = 1.02 ** (1 / 12) - 1
    now = datetime.now()

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # 1. Delete goal
        cur.execute("""
            DELETE FROM saving_goals
             WHERE goal_id = %s AND user_id = %s AND status = 1
        """, (goal_id, user_id))
        if cur.rowcount == 0:
            return {"status": "error", "message": "Goal not found or already inactive."}

        # 2. Fetch remaining active goals
        cur.execute("""
            SELECT goal_id, month_req
              FROM saving_goals
             WHERE user_id = %s AND status = 1
        """, (user_id,))
        updated_goals = cur.fetchall()

        if not updated_goals:
            return {
                "status": "success",
                "message": f"Goal {goal_id} deleted. No remaining active goals.",
            }

        # 3. Recalculate weights based on existing month_req values
        total_req = sum(float(g["month_req"]) for g in updated_goals if g["month_req"] and g["month_req"] > 0)

        for g in updated_goals:
            gid = g["goal_id"]
            req = float(g["month_req"]) if g["month_req"] else 0
            weight = round(req / total_req, 5) if total_req > 0 else round(1 / len(updated_goals), 5)
            cur.execute("""
                UPDATE saving_goals
                   SET weight = %s, updated_at = %s
                 WHERE goal_id = %s
            """, (weight, now, gid))

        conn.commit()
        return {
            "status": "success",
            "message": f"Goal {goal_id} deleted. Weights updated .",
        }

    except Exception as e:
        conn.rollback()
        logger.exception("Error in delete_goal for user_id %s and goal_id %s", user_id, goal_id)
        return {"status": "error", "message": str(e)}
    finally:
        cur.close()
        conn.close()

#pause_goal function
def pause_goal(goal_id, user_id):
    rate = 1.02 ** (1 / 12) - 1
    now = datetime.now()

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # 1. Pause the goal (set status = 0)
        cur.execute("""
            UPDATE saving_goals
               SET status = 0, updated_at = %s
             WHERE goal_id = %s AND user_id = %s AND status = 1
        """, (now, goal_id, user_id))
        if cur.rowcount == 0:
            return {"status": "error", "message": "Goal not found or already inactive."}

        # 2. Fetch remaining active goals
        cur.execute("""
            SELECT goal_id, month_req
              FROM saving_goals
             WHERE user_id = %s AND status = 1
        """, (user_id,))
        updated_goals = cur.fetchall()

        if not updated_goals:
            return {
                "status": "success",
                "message": f"Goal {goal_id} paused. No remaining active goals.",
            }

        # 3. Recalculate weights based on existing month_req values
        total_req = sum(float(g["month_req"]) for g in updated_goals if g["month_req"] and g["month_req"] > 0)

        for g in updated_goals:
            gid = g["goal_id"]
            req = float(g["month_req"]) if g["month_req"] else 0
            weight = round(req / total_req, 5) if total_req > 0 else round(1 / len(updated_goals), 5)
            cur.execute("""
                UPDATE saving_goals
                   SET weight = %s, updated_at = %s
                 WHERE goal_id = %s
            """, (weight, now, gid))

        conn.commit()
        return {
            "status": "success",
            "message": f"Goal {goal_id} paused. Weights updated.",
        }

    except Exception as e:
        conn.rollback()
        logger.exception("Error in pause_goal for user_id %s and goal_id %s", user_id, goal_id)
        return {"status": "error", "message": str(e)}
    finally:
        cur.close()
        conn.close()