import os
import json
import pymysql
import logging
from datetime import datetime
from decimal import Decimal

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def get_db_connection():
    return pymysql.connect(
        host=os.environ['DB_HOST'],
        port=int(os.environ['DB_PORT']),
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD'],
        database=os.environ['DB_NAME'],
        cursorclass=pymysql.cursors.DictCursor
    )

def pause_goal(goal_id, user_id):
    BASE_WEIGHT_POOL = {1: 50, 2: 30, 3: 20}
    TIER_UNIT_WEIGHTS = {1: 5, 2: 3, 3: 2}
    rate = 1.02 ** (1 / 12) - 1
    now = datetime.now()

    def calc_monthly_required(target, current, months):
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

    def calc_eta(target, current, monthly):
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
            return {"status": "error", "message": "Goal not found or already paused."}
        logger.info(f"Paused goal {goal_id} for user {user_id}")

        # 2. Fetch remaining active goals
        cur.execute("""
            SELECT goal_id, priority_level FROM saving_goals
             WHERE user_id = %s AND status = 1
        """, (user_id,))
        rows = cur.fetchall()

        pri_map = {1: [], 2: [], 3: []}
        for gid, lvl in rows:
            pri_map[lvl].append(gid)

        present = [p for p in pri_map if pri_map[p]]
        total_base = sum(BASE_WEIGHT_POOL[p] for p in present)
        missing = 100 - total_base
        total_units = sum(TIER_UNIT_WEIGHTS[p] for p in present)

        new_weights = {}
        for p in present:
            ids = pri_map[p]
            count = len(ids)
            base = BASE_WEIGHT_POOL[p] / count
            redist = (missing * TIER_UNIT_WEIGHTS[p] / total_units) / count if count else 0
            for gid in ids:
                new_weights[gid] = round((base + redist) / 100, 5)

        # 3. Update weights in DB
        for gid, w in new_weights.items():
            cur.execute("""
                UPDATE saving_goals SET weight = %s, updated_at = %s
                 WHERE goal_id = %s
            """, (w, now, gid))

        # 4. Fetch and recalculate monthly & ETA
        cur.execute("""
            SELECT goal_id, target_amount, current_amount, target_date, weight
              FROM saving_goals
             WHERE user_id = %s AND status = 1
        """, (user_id,))
        goals = cur.fetchall()

        recalc_results = []
        for gid, tgt_amt, curr_amt, tgt_date, weight in goals:
            months_left = max(1, (tgt_date - now.date()).days // 30)
            mth_required = calc_monthly_required(tgt_amt, curr_amt, months_left)
            eta_months  = calc_eta(tgt_amt, curr_amt, mth_required)
            recalc_results.append({
                "goal_id": gid,
                "new_weight": weight,
                "monthly_required": mth_required,
                "eta_months": eta_months
            })

        # Convert any Decimal in recalc_results to float
        for goal in recalc_results:
            for k, v in goal.items():
                if isinstance(v, Decimal):
                    goal[k] = float(v)

        conn.commit()
        return {
            "status": "success",
            "message": f"Goal {goal_id} paused. Remaining goals recalculated.",
            "goals": recalc_results
        }

    except Exception as e:
        conn.rollback()
        logger.exception("Error in pause_goal")
        return {"status": "error", "message": str(e)}

    finally:
        cur.close()
        conn.close()

def lambda_handler(event, context):
    try:
        body = event if isinstance(event, dict) else json.loads(event.get("body", event))
        goal_id = body.get("goal_id")
        user_id = body.get("user_id")

        if not goal_id or not user_id:
            msg = "Missing goal_id or user_id"
            logger.error(msg)
            return {
                "statusCode": 400,
                "body": json.dumps({"status": "error", "message": msg})
            }

        result = pause_goal(goal_id, user_id)
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