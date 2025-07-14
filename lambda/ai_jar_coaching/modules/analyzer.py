from datetime import datetime
import calendar
import pytz

VN_tz = pytz.timezone('Asia/Ho_Chi_Minh')

def analyze_jars(jars: list):
    today = datetime.now(VN_tz).day
    days_in_month = calendar.monthrange(datetime.now(VN_tz).year, datetime.now(VN_tz).month)[1]
    days_remaining = days_in_month - today + 1

    triggered_jars = []
    for jar in jars:
        budget = float(jar['virtual_budget_amount'])
        spent = float(jar['spent_amount'])
        remaining_budget = budget - spent

        if days_remaining <= 0 or days_in_month == 0:
            continue

        ideal_daily_spending = budget / days_in_month
        actual_daily_spending = remaining_budget / days_remaining

        jar['remaining_budget'] = remaining_budget
        jar['ideal_daily_spending'] = ideal_daily_spending
        jar['actual_daily_spending'] = actual_daily_spending
        jar['triggered'] = False

        # Trigger logic for encouragement jars (spend more)
        if jar['jar_code'] in ['EDU', 'GIV']:
            if actual_daily_spending > ideal_daily_spending * 1.2:
                jar['triggered'] = True
        # Trigger logic for regular jars (spend less)
        else:
            if actual_daily_spending < ideal_daily_spending * 1.2:
                jar['triggered'] = True
        
        if jar['triggered']:
            triggered_jars.append(jar)

    return triggered_jars
