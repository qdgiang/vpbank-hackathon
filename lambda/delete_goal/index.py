import os, json, logging, pymysql
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


def lambda_handler(event, context):
    try:
        body = json.loads(event["body"]) if "body" in event else event
        goal_id = body.get("goal_id")
        user_id = body.get("user_id")

        if not goal_id or not user_id:
            return {
                "statusCode": 400,
                "body": json.dumps({"status": "error", "message": "Missing goal_id or user_id"})
            }

        result = delete_goal(goal_id, user_id)
        return {"statusCode": 200, "body": json.dumps(result)}

    except Exception as e:
        logger.exception("Unhandled exception in lambda_handler")
        return {
            "statusCode": 500,
            "body": json.dumps({"status": "error", "message": str(e)})
        }
