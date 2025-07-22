import json
import logging
import os
import boto3
from typing import Dict, Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment Variables
CRUD_TRANSACTION_LAMBDA = os.environ.get('CRUD_TRANSACTION_LAMBDA', 'smart-jarvis-crud-transaction')
AI_CLASSIFY_LAMBDA = os.environ.get('AI_CLASSIFY_LAMBDA', 'smart-jarvis-phuong-test')
CRUD_NOTIFICATION_LAMBDA = os.environ.get('CRUD_NOTIFICATION_LAMBDA', 'smart-jarvis-crud-notification')
CRUD_JAR_LAMBDA = os.environ.get('CRUD_JAR_LAMBDA', 'smart-jarvis-crud-jar')

lambda_client = boto3.client('lambda')

# --- Notification helper ---
def notify_transaction_event(user_id, title, message, notification_type, severity, transaction_id):
    payload = {
        "body": json.dumps({
            "user_id": user_id,
            "title": title,
            "message": message,
            "notification_type": notification_type,
            "severity": severity,
            "object_code": "TRANSACTION",
            "object_id": transaction_id
        }),
        "httpMethod": "POST",
        "path": "/notification/create"
    }
    try:
        lambda_client.invoke(
            FunctionName=CRUD_NOTIFICATION_LAMBDA,
            InvocationType='Event',
            Payload=json.dumps(payload)
        )
    except Exception as e:
        logger.error(f"Send notification failed: {e}")

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    results = []
    for record in event['Records']:
        message_id = record['messageId']
        body = record['body']
        step_result = {'messageId': message_id, 'steps': []}

        try:
            transaction_data = json.loads(body)
        except Exception as e:
            logger.error(f"Invalid JSON: {e}")
            step_result['steps'].append({'step': 'parse_message', 'status': 'failed', 'error': str(e)})
            results.append(step_result)
            continue

        user_id = transaction_data.get('user_id')
        transaction_id = None
        category_label = None

        # 1. Create Transaction
        try:
            crud_payload = {
                'body': json.dumps(transaction_data),
                'httpMethod': 'POST',
                'path': '/transaction/create'
            }
            crud_resp = lambda_client.invoke(
                FunctionName=CRUD_TRANSACTION_LAMBDA,
                InvocationType='RequestResponse',
                Payload=json.dumps(crud_payload)
            )
            crud_resp_body = json.loads(crud_resp['Payload'].read())
            crud_status = crud_resp_body.get('statusCode')
            crud_body = json.loads(crud_resp_body.get('body', '{}'))

            if crud_status == 201:
                transaction_id = crud_body.get('transaction_id')
                step_result['steps'].append({
                    'step': 'create_transaction',
                    'status': 'success',
                    'transaction_id': transaction_id,
                    'response': crud_body
                })
                notify_transaction_event(user_id, "Giao dịch thành công", "Giao dịch của bạn đã được ghi nhận thành công.", "transaction", "info", transaction_id)
            else:
                step_result['steps'].append({'step': 'create_transaction', 'status': 'failed', 'response': crud_body})
                notify_transaction_event(user_id, "Giao dịch thất bại", "Giao dịch của bạn không thành công. Vui lòng thử lại.", "transaction", "error", crud_body.get('transaction_id', ''))
                results.append(step_result)
                continue
        except Exception as e:
            logger.error(f"Create transaction failed: {e}")
            step_result['steps'].append({'step': 'create_transaction', 'status': 'failed', 'error': str(e)})
            notify_transaction_event(user_id, "Giao dịch thất bại", "Giao dịch của bạn không thành công. Vui lòng thử lại.", "transaction", "error", '')
            results.append(step_result)
            continue

        # 2. AI Classify
        if transaction_data.get('tranx_type') not in ['transfer_in', 'cashback', 'refund']:
            try:
                ai_payload = {
                    'transaction_id': transaction_id,
                    'user_id': user_id,
                    'msg_content': transaction_data.get('msg_content'),
                    'amount': transaction_data.get('amount'),
                    'txn_time': transaction_data.get('txn_time'),
                    'merchant': transaction_data.get('merchant'),
                    'to_account_name': transaction_data.get('to_account_name'),
                    'location': transaction_data.get('location'),
                    'channel': transaction_data.get('channel'),
                    'tranx_type': transaction_data.get('tranx_type')
                }
                ai_resp = lambda_client.invoke(
                    FunctionName=AI_CLASSIFY_LAMBDA,
                    InvocationType='RequestResponse',
                    Payload=json.dumps(ai_payload)
                )
                ai_resp_body = json.loads(ai_resp['Payload'].read())
                ai_status = ai_resp_body.get('statusCode')
                ai_body = json.loads(ai_resp_body.get('body', '{}')) if 'body' in ai_resp_body else ai_resp_body
                category_label = ai_body.get('jar')

                if ai_status == 200 and category_label:
                    step_result['steps'].append({
                        'step': 'ai_classify',
                        'status': 'success',
                        'category_label': category_label,
                        'response': ai_body
                    })
                else:
                    step_result['steps'].append({'step': 'ai_classify', 'status': 'failed', 'response': ai_body})
                    notify_transaction_event(user_id, "Phân loại thất bại", "Không thể phân loại giao dịch. Bạn có thể phân loại thủ công.", "classify", "warning", transaction_id)
                    results.append(step_result)
                    continue
            except Exception as e:
                logger.error(f"AI classify failed: {e}")
                step_result['steps'].append({'step': 'ai_classify', 'status': 'failed', 'error': str(e)})
                notify_transaction_event(user_id, "Phân loại thất bại", "Hệ thống gặp lỗi khi phân loại giao dịch.", "classify", "error", transaction_id)
                results.append(step_result)
                continue

            # 3. Classify Transaction
            try:
                classify_payload = {
                    'pathParameters': {'id': transaction_id},
                    'body': json.dumps({'user_id': user_id, 'category_label': category_label}),
                    'httpMethod': 'PATCH',
                    'path': f'/transaction/{transaction_id}/classify'
                }
                classify_resp = lambda_client.invoke(
                    FunctionName=CRUD_TRANSACTION_LAMBDA,
                    InvocationType='RequestResponse',
                    Payload=json.dumps(classify_payload)
                )
                classify_resp_body = json.loads(classify_resp['Payload'].read())
                classify_status = classify_resp_body.get('statusCode')
                classify_body = json.loads(classify_resp_body.get('body', '{}'))

                if classify_status == 200:
                    step_result['steps'].append({
                        'step': 'classify_transaction',
                        'status': 'success',
                        'response': classify_body
                    })
                    notify_transaction_event(user_id, "Phân loại giao dịch", f"Giao dịch đã được phân loại là {category_label}. Bạn có muốn thay đổi không?", "classify", "info", transaction_id)
                else:
                    step_result['steps'].append({'step': 'classify_transaction', 'status': 'failed', 'response': classify_body})
                    notify_transaction_event(user_id, "Phân loại thất bại", "Không thể ghi nhận phân loại giao dịch.", "classify", "error", transaction_id)
                    results.append(step_result)
                    continue
            except Exception as e:
                logger.error(f"Classify transaction failed: {e}")
                step_result['steps'].append({'step': 'classify_transaction', 'status': 'failed', 'error': str(e)})
                notify_transaction_event(user_id, "Phân loại thất bại", "Không thể phân loại giao dịch. Vui lòng thử lại.", "classify", "error", transaction_id)
                results.append(step_result)
                continue

            # 4. Update Jar
            try:
                update_jar_payload = {
                    "body": json.dumps({
                        "action": "update_jar_amount",
                        "user_id": user_id,
                        "amount": transaction_data.get('amount'),
                        "tranx_type": transaction_data.get('tranx_type'),
                        "category_label": category_label
                    }),
                    "httpMethod": "POST",
                    "path": "/jar/update_budget"
                }
                jar_resp = lambda_client.invoke(
                    FunctionName=CRUD_JAR_LAMBDA,
                    InvocationType='RequestResponse',
                    Payload=json.dumps(update_jar_payload)
                )

                jar_resp_body = json.loads(jar_resp['Payload'].read())
                update_status = jar_resp_body.get('statusCode', 500)

                step_result['steps'].append({
                    'step': 'update_jar_amount',
                    'status': 'success' if update_status == 200 else 'failed',
                    'response': jar_resp_body.get('body')
                })

                if update_status != 200:
                    notify_transaction_event(user_id, "Cập nhật hũ thất bại", "Không thể cập nhật số tiền vào hũ. Vui lòng kiểm tra lại.", "jar", "warning", transaction_id)
            except Exception as e:
                logger.error(f"Update jar after classify failed: {e}")
                step_result['steps'].append({'step': 'update_jar_amount', 'status': 'failed', 'error': str(e)})
                notify_transaction_event(user_id, "Cập nhật hũ thất bại", "Hệ thống gặp lỗi khi cập nhật hũ.", "jar", "error", transaction_id)

            results.append(step_result)

    return {
        'statusCode': 200,
        'body': json.dumps({'results': results}, ensure_ascii=False)
    }
