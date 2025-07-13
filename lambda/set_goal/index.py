import os
import json
import pymysql
from datetime import datetime, date
from decimal import Decimal
import logging

# === Logger Setup ===
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# === DB CONFIG from ENV variables ===
def get_db_connection():
    return pymysql.connect(
        host=os.environ['DB_HOST'],
        port=int(os.environ['DB_PORT']),
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD'],
        database=os.environ['DB_NAME'],
        cursorclass=pymysql.cursors.DictCursor
    )

def create_goal(data, user_id):
    BASE_WEIGHT_POOL = {1: 50, 2: 30, 3: 20}
    TIER_UNIT_WEIGHTS = {1: 5, 2: 3, 3: 2}
    rate = 1.02 ** (1 / 12) - 1

    def calculate_monthly_required(target, current, months):
        if months <= 0: return None
        target = float(target)
        current = float(current)
        factor = (1 + rate) ** months
        try:
            numerator = target - current * factor
            denominator = (factor - 1) / rate
            return round(numerator / denominator, 2)
        except ZeroDivisionError:
            return None

    def calculate_eta(target, current, monthly):
        if monthly <= 0: return None
        target = float(target)
        current = float(current)
        monthly = float(monthly)
        n = 1
        while n < 600:
            factor = (1 + rate) ** n
            fv = current * factor + monthly * (factor - 1) / rate
            if fv >= target:
                return n
            n += 1
        return None

    logger.info(f"create_goal invoked for user_id={user_id} with data={data}")

    required_fields = ['goal_name', 'target_amount', 'target_date',
                       'goal_type', 'priority_level', 'eta_lock']
    for field in required_fields:
        if field not in data:
            msg = f"Missing field: {field}"
            logger.error(msg)
            return {"status": "error", "message": msg}

    conn = get_db_connection()
    cur = conn.cursor()
    now = datetime.now()

    try:
        # 1. Check max active goals
        cur.execute("""
            SELECT COUNT(*) FROM saving_goals
            WHERE user_id = %s AND status = 1
        """, (user_id,))
        if cur.fetchone()[0] >= 5:
            return {"status": "error", "message": "You can only have up to 5 active goals."}

        # 2. Generate new goal_id
        cur.execute("SELECT COALESCE(MAX(CAST(goal_id AS INTEGER)), 0) + 1 FROM saving_goals")
        new_goal_id = str(cur.fetchone()[0])

        # 3. Insert new goal
        cur.execute("""
            INSERT INTO saving_goals (
                goal_id, user_id, goal_name, target_amount, current_amount,
                target_date, goal_type, priority_level, weight, status,
                eta_lock, initial_target_date, sent_money, created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, 0.00,
                %s, %s, %s, 0.00, 1,
                %s, %s, FALSE, %s, %s
            )
        """, (
            new_goal_id,
            user_id,
            data['goal_name'],
            Decimal(data['target_amount']),
            data['target_date'],
            data['goal_type'],
            int(data['priority_level']),
            bool(data['eta_lock']),
            data['target_date'],
            now,
            now
        ))

        # 4. Get all active goals for this user
        cur.execute("""
            SELECT goal_id, priority_level
              FROM saving_goals
             WHERE user_id = %s AND status = 1
        """, (user_id,))
        rows = cur.fetchall()

        pri_map = {1: [], 2: [], 3: []}
        for gid, lvl in rows:
            pri_map[lvl].append(gid)

        present = [p for p in pri_map if pri_map[p]]
        total_base = sum(BASE_WEIGHT_POOL[p] for p in present)
        missing_w = 100 - total_base
        total_units = sum(TIER_UNIT_WEIGHTS[p] for p in present)

        new_weights = {}
        for p in present:
            ids = pri_map[p]
            count = len(ids)
            base_share = BASE_WEIGHT_POOL[p] / count
            redist = (missing_w * TIER_UNIT_WEIGHTS[p] / total_units) / count if count else 0
            for gid in ids:
                new_weights[gid] = round((base_share + redist) / 100, 5)

        # 5. Update weights
        for gid, w in new_weights.items():
            cur.execute("""
                UPDATE saving_goals
                   SET weight = %s, updated_at = %s
                 WHERE goal_id = %s
            """, (w, now, gid))

        # 6. Fetch newly inserted goal to compute monthly & ETA
        cur.execute("""
            SELECT target_amount, current_amount, target_date, weight
              FROM saving_goals
             WHERE goal_id = %s
        """, (new_goal_id,))
        tgt_amt, curr_amt, tgt_date, weight = cur.fetchone()
        months_remaining = max(1, (tgt_date - now.date()).days // 30)

        monthly_required = calculate_monthly_required(tgt_amt, curr_amt, months_remaining)
        eta_months = calculate_eta(tgt_amt, curr_amt, monthly_required)

        conn.commit()
        return {
            "status": "success",
            "goal_id": new_goal_id,
            "monthly_required": monthly_required,
            "eta_months": eta_months,
            "message": "Goal created and weights updated."
        }

    except Exception as e:
        conn.rollback()
        logger.exception("Error in create_goal, transaction rolled back")
        return {"status": "error", "message": str(e)}

    finally:
        cur.close()
        conn.close()
        logger.info("DB connection closed")


# === Lambda Handler ===
def lambda_handler(event, context):
    try:
        body = event if isinstance(event, dict) else json.loads(event.get("body", event))
        user_id = body.get("user_id")
        data = body.get("data")

        if not user_id or not data:
            msg = "Missing user_id or data"
            logger.error(msg)
            return {
                "statusCode": 400,
                "body": json.dumps({"status": "error", "message": msg})
            }

        result = create_goal(data, user_id)
        return {
            "statusCode": 200,
            "body": json.dumps(result)
        }

    except Exception as e:
        logger.exception("Unhandled exception in lambda_handler")
        return {
            "statusCode": 500,
            "body": json.dumps({"status": "error", "message": str(e)})
        }