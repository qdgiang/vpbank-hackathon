import json
import os
import pymysql
import logging
import boto3
from datetime import datetime, date
import pytz
import time
os.environ["TZ"] = "Asia/Ho_Chi_Minh"
time.tzset()
# from dotenv import load_dotenv
# load_dotenv()

VN_tz = pytz.timezone('Asia/Ho_Chi_Minh')
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S',
                    handlers=[
                        logging.StreamHandler()
                    ])
logger = logging.getLogger(__name__)

# Env var
knowledge_base_id = os.environ.get("bedrock_kb_id", "MNWC7LRVAI")
model_arn = os.environ.get("bedrock_model_id", "arn:aws:bedrock:ap-southeast-2:055029294644:inference-profile/apac.anthropic.claude-sonnet-4-20250514-v1:0")

# Initialize AWS clients
bedrock_agent_runtime_client = boto3.client(service_name='bedrock-agent-runtime', region_name=os.environ.get("aws_region", "ap-southeast-2"))
bedrock_runtime_client = boto3.client(service_name='bedrock-runtime', region_name=os.environ.get("aws_region", "ap-southeast-2"))

def get_db_connection():
    """Establishes a connection to the RDS MySQL database."""
    try:
        db_host = os.environ.get('db_host', '127.0.0.1')
        db_port = int(os.environ.get('db_port', 3307))
        db_name = os.environ.get('db_name', 'testdb')
        db_user = os.environ.get('db_user', 'root')
        db_password = os.environ.get('db_password', '')

        logger.info(f"Connecting to database: {db_name} at {db_host}:{db_port}")
        connection = pymysql.connect(
            host=db_host,
            port=db_port,
            database=db_name,
            user=db_user,
            password=db_password,
            cursorclass=pymysql.cursors.DictCursor
        )
        logger.info("Database connection successful")
        return connection
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise

def get_active_goals(cursor, user_id):
    """Fetches active savings goals for a given user from the database."""
    query = "SELECT * FROM saving_goals WHERE user_id = %s AND is_active = TRUE"
    logger.info(f"Executing query for user_id: {user_id}")
    cursor.execute(query, (user_id,))
    goals = cursor.fetchall()
    logger.info(f"Found {len(goals)} active goals.")
    return goals

def analyze_goals(goals):
    """Analyzes the progress and urgency of each savings goal."""
    analysis_results = []
    today = datetime.now(tz=VN_tz).date()

    def months_between(d1: date, d2: date):
        return (d1.year - d2.year) * 12 + d1.month - d2.month

    for goal in goals:
        try:
            target_date = goal['target_date'].date() if isinstance(goal['target_date'], datetime) else (datetime.strptime(goal['target_date'], '%Y-%m-%d').date() if isinstance(goal['target_date'], str) else goal['target_date'])
            initial_target_date = goal['initial_target_date'].date() if isinstance(goal['initial_target_date'], datetime) else (datetime.strptime(goal['initial_target_date'], '%Y-%m-%d').date() if isinstance(goal['initial_target_date'], str) else goal['initial_target_date'])
            created_at_date = goal['created_at'].date() if isinstance(goal['created_at'], datetime) else (datetime.strptime(goal['created_at'], '%Y-%m-%dT%H:%M:%S%z').date() if isinstance(goal['created_at'], str) else goal['created_at'])

            target_amount = float(goal['target_amount'])
            current_amount = float(goal['current_amount'])
            progress_percent = (current_amount / target_amount) * 100 if target_amount > 0 else 0

            remaining_months = months_between(target_date, today)
            if remaining_months < 0: 
                remaining_months = 0

            elapsed_months = months_between(today, created_at_date)
            if elapsed_months <= 0: 
                elapsed_months = 1

            initial_total_months = months_between(initial_target_date, created_at_date)
            if initial_total_months <= 0: 
                initial_total_months = 1

            remaining_amount = target_amount - current_amount
            current_monthly_saving_needed = (remaining_amount / remaining_months) if remaining_months > 0 else remaining_amount
            initial_monthly_saving_needed = target_amount / initial_total_months

            expected_amount = initial_monthly_saving_needed * elapsed_months
            if current_amount >= expected_amount * 1.1:
                on_track_status = "Ahead"
            elif current_amount >= expected_amount * 0.9:
                on_track_status = "On Track"
            else:
                on_track_status = "Behind"

            analysis_results.append({
                "goal_name": goal['goal_name'],
                "goal_type": goal['goal_type'],
                "priority_level": goal['priority_level'],
                "progress_percent": round(progress_percent, 2),
                "on_track_status": on_track_status,
                "current_amount": current_amount,
                "target_amount": target_amount,
                "target_date": target_date.isoformat(),
                "remaining_months": remaining_months,
                "current_monthly_saving_needed": round(current_monthly_saving_needed, 2),
                "initial_monthly_saving_needed": round(initial_monthly_saving_needed, 2),
            })
        except Exception as e:
            logger.error(f"Could not analyze goal '{goal.get('goal_name', 'N/A')}': {e}")

    return analysis_results

# LLM Invoke
def _invoke_llm(prompt, model_arn):
    try:
        logger.info(f"Invoking model: {model_arn}")

        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "temperature": 0.7,
            "messages": [
                {
                    "role": "user",
                    "content": [{
                        "type": "text",
                        "text": prompt
                    }]
                }
            ]
        })

        response = bedrock_runtime_client.invoke_model(
            body=body,
            modelId=model_arn,
            accept='application/json',
            contentType='application/json'
        )

        response_body = json.loads(response.get('body').read())
        completion = response_body['content'][0]['text']
        return completion

    except Exception as e:
        logger.error(f"Error invoking Bedrock model: {e}")
        raise

def generate_financial_advice(analysis_results, knowledge_base_id, model_arn):
    """Generates financial advice in a two-step process."""
    if not analysis_results:
        return {"advice": "No active goals to analyze. Start by setting a new savings goal!", "retrieved_references": []}

    try:
        # STEP 1: Generate initial summary and high-level advice
        logger.info("Step 1: Generating initial progress summary and advice.")
        analysis_summary = []
        for goal in analysis_results:
            summary_line = (
                f"- Goal '{goal['goal_name']}': Status '{goal['on_track_status']}'. "
                f"Current monthly saving needed is {goal['current_monthly_saving_needed']:,.0f} VND, "
                f"compared to the initial monthly saving needed {goal['initial_monthly_saving_needed']:,.0f} VND."
            )
            analysis_summary.append(summary_line)
        analysis_text = "\n".join(analysis_summary)

        prompt_step1 = (
            f"Human: You are a friendly and professional Vietnamese financial advisor. "
            f"A customer has the following active savings goals and our analysis of their progress:\n"
            f"<analysis_summary>\n{analysis_text}\n</analysis_summary>\n\n"
            f"Based on this data, please provide a clear and encouraging summary of their financial situation. Follow these instructions:\n"
            f"1. Start with an overall positive remark. Address the user in a friendly tone (e.g., 'Chào bạn,').\n"
            f"2. For each goal, comment on its status. Praise them for goals that are 'Ahead' or 'On Track'. For goals that are 'Behind', be encouraging and state the required monthly saving as a clear, actionable step.\n"
            f"3. Conclude with a brief, high-level summary of their overall financial health without mentioning specific products yet. Write the entire response in Vietnamese."
            f"\n\nAssistant:"
        )
        general_advice = _invoke_llm(prompt_step1, model_arn)
        logger.info(f"Generated general advice: {general_advice}")

        # STEP 2: Retrieve relevant products and generate specific recommendations
        logger.info("Step 2: Retrieving relevant products from Knowledge Base.")
        retrieval_response = bedrock_agent_runtime_client.retrieve(
            knowledgeBaseId=knowledge_base_id,
            retrievalQuery={'text': general_advice},
            retrievalConfiguration={
                'vectorSearchConfiguration': {
                    'numberOfResults': 3
                }
            }
        )

        retrieved_chunks = retrieval_response.get("retrievalResults", [])
        retrieved_references = [chunk.get('content', {}).get('text') for chunk in retrieved_chunks]
        logger.info(f"Retrieved {len(retrieved_references)} document chunks.")

        context_for_prompt = "\n".join(retrieved_references)

        logger.info("Step 2b: Generating final, specific advice with retrieved products.")
        prompt_step2 = (
            f"Human: You are a Vietnamese financial advisor continuing a conversation. Here is the summary of the customer's situation and our initial advice:\n"
            f"<initial_advice>\n{general_advice}\n</initial_advice>\n\n"
            f"Here is some information about potentially relevant financial products from our knowledge base:\n"
            f"<product_info>\n{context_for_prompt}\n</product_info>\n\n"
            f"Now, create a final, actionable recommendation in Vietnamese. Follow these steps:\n"
            f"1. Briefly reiterate the key points from the initial advice.\n"
            f"2. Naturally integrate specific products from the <product_info> that can help the user with their goals. For example, if they are behind on a savings goal, suggest a high-yield savings account or a short-term investment product.\n"
            f"3. For each product you recommend, clearly explain WHY it is a good fit for their specific situation and goals mentioned in the <initial_advice>. Be professional, encouraging, and clear.\n"
            f"4. Structure the final output cleanly. Use headings or bullet points if necessary."
            f"\n\nAssistant:"
        )
        final_advice = _invoke_llm(prompt_step2, model_arn)
        logger.info(f"Generated final advice: {final_advice}")

        return {
            "advice": final_advice,
            "retrieved_references": retrieved_chunks
        }

    except Exception as e:
        logger.error(f"Error during financial advice generation: {e}")
        raise


def handler(event, context):
    """
    Main Lambda handler to provide financial advice based on user's savings goals.
    """
    try:
        logger.info(f"Lambda triggered with event: {event}")
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('user_id')

        if not user_id:
            return {"statusCode": 400, "body": json.dumps("Error: user_id is required.")}

        connection = get_db_connection()
        with connection.cursor() as cursor:
            goals = get_active_goals(cursor, user_id)
            analysis = analyze_goals(goals)

        connection.close()

        financial_advice = generate_financial_advice(analysis, knowledge_base_id, model_arn)
        response_body = {
            "message": "Successfully generated financial advice.",
            "user_id": user_id,
            "goal_analysis": analysis,
            "financial_advice": financial_advice
        }

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(response_body, default=str)
        }

    except Exception as e:
        logger.error(f"An error occurred: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }

if __name__ == "__main__":
    # test
    test_event = {
        "body": json.dumps({
            "user_id": "USER1"
        })
    }
    handler(test_event, None)