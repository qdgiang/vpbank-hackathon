import json
import logging
import os
import boto3
from typing import Dict, Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)

CRUD_TRANSACTION_LAMBDA = os.environ.get('CRUD_TRANSACTION_LAMBDA', 'crud_transaction')
AI_CLASSIFY_LAMBDA = os.environ.get('AI_CLASSIFY_LAMBDA', 'ai_transaction_classify')

lambda_client = boto3.client('lambda')

# --- Notification helper ---
def send_notification(lambda_client, user_id, title, message, notification_type, severity, object_code, object_id):
    notification_payload = {
        "body": json.dumps({
            "user_id": user_id,
            "title": title,
            "message": message,
            "notification_type": notification_type,
            "severity": severity,
            "object_code": object_code,
            "object_id": object_id
        }),
        "httpMethod": "POST",
        "path": "/notification/create"
    }
    try:
        notif_resp = lambda_client.invoke(
            FunctionName=os.environ.get('CRUD_NOTIFICATION_LAMBDA', 'crud_notification'),
            InvocationType='Event',
            Payload=json.dumps(notification_payload)
        )
    except Exception as e:
        logger.error(f"Send notification failed: {e}")

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Orchestrate transaction creation and classification via Lambda invocations.
    """
    results = []
    for record in event['Records']:
        message_id = record['messageId']
        body = record['body']
        step_result = {
            'messageId': message_id,
            'steps': []
        }
        try:
            transaction_data = json.loads(body)
        except Exception as e:
            logger.error(f"Invalid JSON: {e}")
            step_result['steps'].append({
                'step': 'parse_message',
                'status': 'failed',
                'error': str(e)
            })
            results.append(step_result)
            continue

        # 1. Call CRUD Lambda to create transaction
        try:
            crud_payload = {
                'body': json.dumps(transaction_data),
                'httpMethod': 'POST',
                'path': '/create'
            }
            crud_resp = lambda_client.invoke(
                FunctionName=CRUD_TRANSACTION_LAMBDA,
                InvocationType='RequestResponse',
                Payload=json.dumps(crud_payload)
            )
            crud_resp_body = json.loads(crud_resp['Payload'].read())
            crud_status = crud_resp_body.get('statusCode')
            crud_body = json.loads(crud_resp_body.get('body', '{}'))
            if crud_status != 201:
                step_result['steps'].append({
                    'step': 'create_transaction',
                    'status': 'failed',
                    'response': crud_body
                })
                # Send notification for failed transaction
                send_notification(
                    lambda_client,
                    transaction_data.get('user_id'),
                    "Giao dịch thất bại",
                    "Giao dịch của bạn không thành công. Vui lòng thử lại.",
                    "transaction",
                    "error",
                    "TRANSACTION",
                    crud_body.get('transaction_id', '')
                )
                results.append(step_result)
                continue
            transaction_id = crud_body.get('transaction_id')
            step_result['steps'].append({
                'step': 'create_transaction',
                'status': 'success',
                'transaction_id': transaction_id,
                'response': crud_body
            })
            # Send notification for successful transaction
            send_notification(
                lambda_client,
                transaction_data.get('user_id'),
                "Giao dịch thành công",
                "Giao dịch của bạn đã được ghi nhận thành công.",
                "transaction",
                "info",
                "TRANSACTION",
                transaction_id
            )
        except Exception as e:
            logger.error(f"Create transaction failed: {e}")
            step_result['steps'].append({
                'step': 'create_transaction',
                'status': 'failed',
                'error': str(e)
            })
            # Send notification for failed transaction (exception)
            send_notification(
                lambda_client,
                transaction_data.get('user_id'),
                "Giao dịch thất bại",
                "Giao dịch của bạn không thành công. Vui lòng thử lại.",
                "transaction",
                "error",
                "TRANSACTION",
                ''
            )
            results.append(step_result)
            continue

        # 2. Call AI classify Lambda
        try:
            ai_payload = {
                'transaction_id': transaction_id,
                'user_id': transaction_data.get('user_id'),
                'msg_content': transaction_data.get('msg_content'),
                'amount': transaction_data.get('amount')
            }
            ai_resp = lambda_client.invoke(
                FunctionName=AI_CLASSIFY_LAMBDA,
                InvocationType='RequestResponse',
                Payload=json.dumps(ai_payload)
            )
            ai_resp_body = json.loads(ai_resp['Payload'].read())
            ai_status = ai_resp_body.get('statusCode')
            ai_body = json.loads(ai_resp_body.get('body', '{}')) if 'body' in ai_resp_body else ai_resp_body
            category_label = ai_body.get('category_label')
            if ai_status != 200 or not category_label:
                step_result['steps'].append({
                    'step': 'ai_classify',
                    'status': 'failed',
                    'response': ai_body
                })
                results.append(step_result)
                continue
            step_result['steps'].append({
                'step': 'ai_classify',
                'status': 'success',
                'category_label': category_label,
                'response': ai_body
            })
        except Exception as e:
            logger.error(f"AI classify failed: {e}")
            step_result['steps'].append({
                'step': 'ai_classify',
                'status': 'failed',
                'error': str(e)
            })
            results.append(step_result)
            continue

        # 3. Call CRUD Lambda to classify transaction
        try:
            classify_payload = {
                'pathParameters': {'id': transaction_id},
                'body': json.dumps({
                    'user_id': transaction_data.get('user_id'),
                    'category_label': category_label
                }),
                'httpMethod': 'PATCH',
                'path': f'/{transaction_id}/classify'
            }
            classify_resp = lambda_client.invoke(
                FunctionName=CRUD_TRANSACTION_LAMBDA,
                InvocationType='RequestResponse',
                Payload=json.dumps(classify_payload)
            )
            classify_resp_body = json.loads(classify_resp['Payload'].read())
            classify_status = classify_resp_body.get('statusCode')
            classify_body = json.loads(classify_resp_body.get('body', '{}'))
            if classify_status != 200:
                step_result['steps'].append({
                    'step': 'classify_transaction',
                    'status': 'failed',
                    'response': classify_body
                })
                results.append(step_result)
                continue
            step_result['steps'].append({
                'step': 'classify_transaction',
                'status': 'success',
                'response': classify_body
            })
            # Send notification for classify success (user confirm)
            send_notification(
                lambda_client,
                transaction_data.get('user_id'),
                "Phân loại giao dịch",
                f"Giao dịch của bạn đã được phân loại là {category_label}. Bạn có muốn xác nhận không?",
                "classify",
                "info",
                "TRANSACTION",
                transaction_id
            )
        except Exception as e:
            logger.error(f"Classify transaction failed: {e}")
            step_result['steps'].append({
                'step': 'classify_transaction',
                'status': 'failed',
                'error': str(e)
            })
            results.append(step_result)
            continue

        # 4. Call CRUD_JAR_LAMBDA to update jar amount after classify (orchestration step)
        try:
            update_jar_payload = {
                "action": "update_jar_amount",
                "user_id": transaction_data.get('user_id'),
                "amount": transaction_data.get('amount'),
                "tranx_type": transaction_data.get('tranx_type'),
                "category_label": category_label
            }
            jar_resp = lambda_client.invoke(
                FunctionName=os.environ.get('CRUD_JAR_LAMBDA', 'crud_jar'),
                InvocationType='RequestResponse',
                Payload=json.dumps(update_jar_payload)
            )
            jar_resp_body = json.loads(jar_resp['Payload'].read())
            step_result['steps'].append({
                'step': 'update_jar_amount',
                'status': 'success' if jar_resp_body.get('statusCode', 500) == 200 else 'failed',
                'response': jar_resp_body.get('body')
            })
        except Exception as e:
            logger.error(f"Update jar after classify failed: {e}")
            step_result['steps'].append({
                'step': 'update_jar_amount',
                'status': 'failed',
                'error': str(e)
            })

        results.append(step_result)

    return {
        'statusCode': 200,
        'body': json.dumps({'results': results}, ensure_ascii=False)
    }