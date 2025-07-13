import os
import json
import pymysql
from datetime import datetime
from decimal import Decimal
from dateutil.relativedelta import relativedelta
import logging
from math import pow

logger = logging.getLogger()
logger.setLevel(logging.INFO)

BASE_WEIGHT_POOL = {1: 50, 2: 30, 3: 20}
TIER_UNIT_WEIGHTS = {1: 5, 2: 3, 3: 2}
RATE = 1.02 ** (1 / 12) - 1

def get_db_connection():
    return pymysql.connect(
        host=os.environ['DB_HOST'],
        port=int(os.environ['DB_PORT']),
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD'],
        database=os.environ['DB_NAME'],
        cursorclass=pymysql.cursors.DictCursor
    )

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

def lambda_handler(event, context):
    try:
        body = event if isinstance(event, dict) else json.loads(event.get("body", event))
        user_id = body.get("user_id")
        data = body.get("data")

        if not user_id or not data:
            return {"statusCode": 400, "body": json.dumps({"status": "error", "message": "Missing user_id or data"})}

        result = set_goal(user_id, data)
        return {"statusCode": 200, "body": json.dumps(result)}

    except Exception as e:
        logger.exception("Unhandled exception in lambda_handler")
        return {"statusCode": 500, "body": json.dumps({"status": "error", "message": str(e)})}
