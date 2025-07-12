import json
import logging
import os
from modules import database, analyzer, llm_generator
import warnings
warnings.filterwarnings("ignore")
import time
os.environ["TZ"] = "Asia/Ho_Chi_Minh"
time.tzset()

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S',
                    handlers=[logging.StreamHandler()])
logger = logging.getLogger()

def handler(event, context):
    """
    Main Lambda handler for Jar Coaching.
    Analyzes user's jar spending and provides AI-powered coaching advice if certain
    thresholds are met.
    """
    try:
        logger.info(f"Lambda triggered with event: {event}")
        
        try:
            body = json.loads(event.get('body', '{}'))
        except json.JSONDecodeError:
            logger.error("Invalid JSON in request body.")
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Invalid JSON format in request body."})
            }
            
        user_id = body.get('user_id')

        if not user_id:
            logger.warning("Missing user_id in request.")
            return {
                "statusCode": 400, 
                "body": json.dumps({"error": "user_id is required."})
            }

        user_jars_data = database.get_user_jars(user_id)
        if not user_jars_data:
            logger.info(f"No spending jar data found for user {user_id}.")
            return {
                "statusCode": 200,
                "body": json.dumps({
                    "triggered_jars": [],
                    "coaching_suggestions": []
                })
            }

        triggered_jars = analyzer.analyze_jars(user_jars_data)
        
        coaching_advice = []
        if triggered_jars:
            logger.info(f"Found {len(triggered_jars)} triggered jars for user {user_id}. Generating advice.")
            coaching_advice = llm_generator.generate_coaching_advice(triggered_jars)
        else:
            logger.info(f"No jars were triggered for user {user_id}.")

        response_body = {
            "triggered_jars": triggered_jars,
            "coaching_suggestions": coaching_advice
        }

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(response_body, default=str, ensure_ascii=False)
        }

    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}", exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "An internal server error occurred."})
        }

# if __name__ == "__main__":
#     test_event = {
#         "body": json.dumps({
#             "user_id": "USER1"
#         })
#     }
#     response = handler(test_event, None)
#     print(response.get("body"))