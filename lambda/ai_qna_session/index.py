import json
import boto3
import logging
import traceback
from typing import Dict, Any, List
import os, sys
import warnings
warnings.filterwarnings("ignore")

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT_DIR)
from modules.database import execute_sql
from modules.knowledge_base import retrieve_financial_products
from modules.tool_definitions import tool_config, system_prompt
from modules.history_manager import load_chat_history, save_to_chat_history, format_prompt_with_history
import decimal
from datetime import date, datetime
import random
import time
from botocore.exceptions import ClientError
# from dotenv import load_dotenv
# load_dotenv()
os.environ["TZ"] = "Asia/Ho_Chi_Minh"
time.tzset()

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S',
                    handlers=[
                        logging.StreamHandler()
                    ])
logger = logging.getLogger(__name__)

bedrock_client = boto3.client('bedrock-runtime', region_name=os.environ.get("AWS_REGION", "ap-southeast-2"))
MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "arn:aws:bedrock:ap-southeast-2:055029294644:inference-profile/apac.anthropic.claude-sonnet-4-20250514-v1:0")

tool_dispatcher = {
    "query_user_jar_spending": execute_sql,
    "query_saving_goals": execute_sql,
    "retrieve_financial_products": retrieve_financial_products,
}

def sanitize(obj):
    if isinstance(obj, decimal.Decimal):
        return float(obj)
    elif isinstance(obj, date):
        return obj.strftime("%Y-%m-%d")
    elif isinstance(obj, datetime):
        return obj.strftime("%Y-%m-%d %H:%M:%S")
    elif isinstance(obj, dict):
        return {k: sanitize(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize(v) for v in obj]
    elif isinstance(obj, tuple):
        return [sanitize(v) for v in obj]
    else:
        return obj

def bedrock_with_retry(client, **kwargs):
    max_retries = 3
    backoff_base = 0.5
    for attempt in range(1, max_retries + 1):
        try:
            return client.converse(**kwargs)
        except ClientError as e:
            if attempt == max_retries:
                raise
            sleep_time = backoff_base * (2 ** (attempt - 1))
            sleep_time = sleep_time * (0.8 + 0.4 * random.random())
            logger.warning(f"Throttled on attempt {attempt}, retrying in {sleep_time:.2f}s")
            time.sleep(sleep_time)

def handler(event: Dict[str, Any], context: object) -> Dict[str, Any]:
    """
    Main Lambda handler for the financial Q&A functionality.
    Orchestrates a conversation with Bedrock's Converse API using a three-step
    batch process.
    """
    try:
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('user_id')
        prompt = body.get('prompt')
        chat_history = body.get('history ', [])

        if not user_id or not prompt:
            return {'statusCode': 400, 'body': json.dumps({'error': 'user_id and prompt are required.'})}

        # chat_history = load_chat_history()
        contextual_prompt = format_prompt_with_history(chat_history, prompt)

        # 1) PLAN – ask model which tools to use based on the contextual prompt
        logger.info(f"[PLAN] Asking model for tool plan for user '{user_id}'")
        plan_resp = bedrock_with_retry(
            bedrock_client,
            modelId=MODEL_ID,
            messages=[{'role': 'user', 'content': [{'text': contextual_prompt}]}],
            system=[{'text': system_prompt}],
            toolConfig=tool_config
        )
        plan_message = plan_resp['output']['message']

        tool_calls = [c['toolUse'] for c in plan_message['content'] if 'toolUse' in c]

        if not tool_calls:
            logger.info("[FINAL] No tools needed. Returning direct answer.")
            final_answer = "".join([c.get('text', '') for c in plan_message['content']])
            # save_to_chat_history(prompt, final_answer, [])
            response_body = {"answer": final_answer, "used_tools": []}
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps(response_body, default=str, ensure_ascii=False)}

        # 2) EXECUTE all planned tools with a retry mechanism for failures
        logger.info(f"[EXECUTE] Got {len(tool_calls)} tool call(s). Executing them in batch.")
        tool_results_content = [None] * len(tool_calls)
        used_tools_log = [None] * len(tool_calls)
        
        # Create a map for easy lookup
        call_map = {call['toolUseId']: {'call': call, 'idx': i} for i, call in enumerate(tool_calls)}

        for i, call in enumerate(tool_calls):
            tool_name = call['name']
            tool_query = call.get('input', {}).get('query')
            try:
                result = sanitize(tool_dispatcher[tool_name](query=tool_query, user_id=user_id))
                tool_results_content[i] = {'toolResult': {'toolUseId': call['toolUseId'], 'content': [{'json': {'results': result}}]}}
                used_tools_log[i] = {"tool_name": tool_name, "query": tool_query, "results": result}
            except Exception as e:
                logger.error(f"Initial execution error for tool '{tool_name}': {traceback.format_exc()}")
                tool_results_content[i] = {'toolResult': {'toolUseId': call['toolUseId'], 'content': [{'text': f'Error: {str(e)}'}], 'status': 'error'}}
                used_tools_log[i] = {"tool_name": tool_name, "query": tool_query, "error": str(e)}

        # Self-correction/re-plan logic for failed tools
        failed_results = [res for res in tool_results_content if res.get('toolResult', {}).get('status') == 'error']

        if failed_results:
            logger.warning(f"[RE-PLAN] Detected {len(failed_results)} failed tool(s). Attempting to self-correct.")

            error_details = []
            failed_tool_names = set()
            for res in failed_results:
                tool_use_id = res['toolResult']['toolUseId']
                original_call = call_map[tool_use_id]['call']
                failed_tool_names.add(original_call['name'])
                # Find the corresponding error log
                error_log_entry = used_tools_log[call_map[tool_use_id]['idx']]
                error_message = error_log_entry.get('error', 'Unknown error')
                error_details.append(f"- Tool: {original_call['name']}\n  Failed Query: {original_call.get('input', {}).get('query')}\n  Error: {error_message}")
            
            error_details_str = "\n".join(error_details)
            replan_prompt = (
                "You previously failed to execute one or more tool calls. "
                "Analyze the errors and provide corrected tool calls. "
                "Only call the tools that failed. Do not call tools that previously succeeded.\n\n"
                f"Original User Query: {contextual_prompt}\n\n"
                "# Failed Tool Details:\n"
                f"{error_details_str}"
            )

            # Filter tool_config to only include the failed tools
            replan_tool_config = {'tools': [tool for tool in tool_config['tools'] if tool['toolSpec']['name'] in failed_tool_names]}

            replan_resp = bedrock_with_retry(
                bedrock_client,
                modelId=MODEL_ID,
                messages=[{'role': 'user', 'content': [{'text': replan_prompt}]}],
                system=[{'text': system_prompt}],
                toolConfig=replan_tool_config
            )

            new_tool_calls = [c['toolUse'] for c in replan_resp['output']['message']['content'] if 'toolUse' in c]

            if new_tool_calls:
                logger.info(f"[RE-EXECUTE] Got {len(new_tool_calls)} corrected tool call(s). Re-executing...")
                for new_call in new_tool_calls:
                    tool_name = new_call['name']
                    tool_query = new_call.get('input', {}).get('query')
                    
                    # Find the original index to replace the result
                    original_call_id = next((res['toolResult']['toolUseId'] for res in failed_results if call_map[res['toolResult']['toolUseId']]['call']['name'] == tool_name), None)
                    if original_call_id:
                        idx = call_map[original_call_id]['idx']
                        try:
                            result = sanitize(tool_dispatcher[tool_name](query=tool_query, user_id=user_id))
                            tool_results_content[idx] = {'toolResult': {'toolUseId': original_call_id, 'content': [{'json': {'results': result}}]}}
                            used_tools_log[idx] = {"tool_name": tool_name, "query": tool_query, "results": result}
                            logger.info(f"Successfully re-executed and corrected tool '{tool_name}'.")
                        except Exception as e:
                            logger.error(f"Self-correction also failed for tool '{tool_name}': {traceback.format_exc()}")
                            error_message = f'Correction failed: {str(e)}'
                            tool_results_content[idx]['toolResult']['content'] = [{'text': error_message}]
                            used_tools_log[idx]['error'] = error_message

        # 3) FINAL – send back results for the final answer
        logger.info(f"[FINAL] Sending tool results back to model.")
        final_messages = [
            {'role': 'user', 'content': [{'text': contextual_prompt}]},
            plan_message,
            {'role': 'user', 'content': tool_results_content}
        ]
        final_resp = bedrock_with_retry(
            bedrock_client,
            modelId=MODEL_ID,
            messages=final_messages,
            system=[{'text': system_prompt}],
            toolConfig=tool_config
        )
        final_answer = "".join([c.get('text', '') for c in final_resp['output']['message']['content']])
        logger.info(f"Final answer generated.")

        # Save the successful exchange to history
        # save_to_chat_history(prompt, final_answer, used_tools_log)

        response_body = {"answer": final_answer, "used_tools": used_tools_log}
        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps(response_body, default=str, ensure_ascii=False)}

    except Exception as e:
        logger.error(f"An unexpected error occurred: {traceback.format_exc()}")
        return {'statusCode': 500, 'body': json.dumps({'error': 'An internal server error occurred.', 'details': str(e)})}

# if __name__ == "__main__":
#     user_id    = "USER1"
#     history = []

#     while True:
#         prompt = input("Enter your question (or type 'exit' to quit): ").strip()
#         if prompt.lower() == "exit":
#             print("Goodbye!")
#             break

#         test_event = {
#             "body": json.dumps({
#                 "user_id": user_id,
#                 "prompt": prompt,
#                 "history": history}, ensure_ascii=False)
#         }
        
#         resp = handler(test_event, None)
#         body = json.loads(resp.get('body', '{}'))
#         history.append(body)
#         answer = body.get('answer', '')
#         # used_tools = body.get('used_tools', [])
#         print("Answer:", answer)
#         # print("Used tools:", used_tools)