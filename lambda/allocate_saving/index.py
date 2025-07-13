import os, json, pymysql, logging
from datetime import datetime, date
from decimal import Decimal
from dateutil.relativedelta import relativedelta


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

def lambda_handler(event, context):
    try:
        body = event if isinstance(event, dict) else json.loads(event.get("body", event))
        user_id = body.get("user_id")
        raw_amount = body.get("sent_amount")
        if raw_amount is None:
            raise ValueError("sent_amount is missing or null")
        try:
            sent_amount = Decimal(str(raw_amount))
        except Exception:
            raise ValueError(f"Invalid sent_amount: {raw_amount}")


        if not user_id or sent_amount is None:
            return {
                "statusCode": 400,
                "body": json.dumps({"status": "error", "message": "Missing user_id or sent_amount"})
            }

        result = allocate_saving(user_id, sent_amount)
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
