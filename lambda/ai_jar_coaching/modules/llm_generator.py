import os
import json
import boto3
import logging

logger = logging.getLogger(__name__)
import random
import time
from botocore.exceptions import ClientError

MAX_RETRIES = 4
BACKOFF_BASE_SEC = 0.5

bedrock_runtime_client = boto3.client(
    service_name='bedrock-runtime', 
    region_name=os.environ.get("AWS_REGION", "ap-southeast-2")
)

# Main bedrock model: finetune-jar-coach-v3 (base llama3-2-3b-instruct-v1)
MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "arn:aws:bedrock:ap-southeast-2:055029294644:inference-profile/apac.anthropic.claude-sonnet-4-20250514-v1:0") # fallback to serverless model if finetuned model is not available

def bedrock_with_retry(client, **kwargs) -> dict:
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return client.converse(**kwargs)
        except ClientError as e:
            if attempt == MAX_RETRIES:
                logger.error("Max retries reached → %s", e)
                raise
            backoff = BACKOFF_BASE_SEC * (2 ** (attempt - 1)) * random.uniform(0.8, 1.2)
            logger.warning("Throttled (%s). Retrying in %.2fs …", e.response["Error"]["Code"], backoff)
            time.sleep(backoff)

def generate_coaching_advice(triggered_jars: list):
    if not triggered_jars:
        return []

    jars_summary = []
    for jar in triggered_jars:
        jar_info = f"- Lọ {jar['jar_code']}: Mức chi tiêu lý tưởng mỗi ngày là {jar['ideal_daily_spending']:,.0f}đ, nhưng mức chi tiêu thực tế còn lại mỗi ngày của bạn chỉ là {jar['actual_daily_spending']:,.0f}đ."
        jars_summary.append(jar_info)

    # Construct the detailed one-shot prompt
    prompt = f"""Human: Bạn là một trợ lý tài chính AI vui tính và thông minh. Nhiệm vụ của bạn là phân tích dữ liệu chi tiêu từ các "lọ" (jars) của người dùng và đưa ra lời khuyên hoặc cảnh báo dưới dạng một danh sách JSON.

**QUY TẮC:**
1.  **Phân tích:**
    - Với các lọ chi tiêu thông thường (FUN, PLAY, v.v.), nếu `actual_daily_spending` < `ideal_daily_spending`, đây là vấn đề cần cảnh báo (chi tiêu quá nhanh).
    - Với các lọ khuyến khích (EDU, GIV), nếu `actual_daily_spending` > `ideal_daily_spending`, đây là vấn đề cần nhắc nhở (chi tiêu quá chậm).
2.  **Định dạng đầu ra:** Phải là một danh sách (array) các đối tượng JSON hợp lệ, không chứa bất kỳ văn bản nào khác ngoài danh sách JSON này.
3.  **Cấu trúc đối tượng JSON:** Mỗi đối tượng phải chứa các key: `jar_code`, `issue`, `recommendation`, `priority`.
    - `jar_code`: Mã của lọ (ví dụ: "PLAY").
    - `issue`: Mô tả ngắn gọn vấn đề ("Chi tiêu cao bất thường" hoặc "Chi tiêu thấp bất thường").
    - `recommendation`: Một lời khuyên/cảnh báo ngắn gọn, hài hước, thông minh bằng tiếng Việt.
    - `priority`: Mức độ ưu tiên ("high", "medium", hoặc "low").

**VÍ DỤ:**
*Input Data:*
- Lọ PLAY: Mức chi tiêu lý tưởng mỗi ngày là 33,333đ, nhưng mức chi tiêu thực tế còn lại mỗi ngày của bạn chỉ là 20,000đ.
- Lọ GIV: Mức chi tiêu lý tưởng mỗi ngày là 16,667đ, nhưng mức chi tiêu thực tế còn lại mỗi ngày của bạn là 25,000đ.

*Expected JSON Output:*
```json
[
  {{
    "jar_code": "PLAY",
    "issue": "Chi tiêu cao bất thường",
    "recommendation": "Bạn đang "vui" hơi quá đà rồi đấy! Giảm tốc độ lại nếu không muốn cuối tháng ăn mì gói nhé!",
    "priority": "high"
  }},
  {{
    "jar_code": "GIV",
    "issue": "Chi tiêu thấp bất thường",
    "recommendation": "Cho đi là còn mãi! Hãy mở lòng để ví bạn nhẹ bớt và tâm hồn thanh thản hơn nào.",
    "priority": "medium"
  }}
]
```

**DỮ LIỆU CẦN PHÂN TÍCH:**
<data>
{', '.join(jars_summary)}
</data>

Bây giờ, hãy tạo danh sách JSON dựa trên dữ liệu trên.

Assistant:
```json
"""

    try:
        # body = json.dumps({
        #     "anthropic_version": "bedrock-2023-05-31",
        #     "max_tokens": 4096,
        #     "temperature": 0.8,
        #     "messages": [{
        #         "role": "user",
        #         "content": [{ "type": "text", "text": prompt }]
        #     }]
        # })

        # response = bedrock_runtime_client.invoke_model(
        #     body=body,
        #     modelId=MODEL_ID,
        # )
        # response_body = json.loads(response.get('body').read())
        # raw_completion = response_body['content'][0]['text']
        
        # cleaned_json_str = raw_completion.strip().replace('```json', '').replace('```', '').strip()
        
        response = bedrock_with_retry(
            bedrock_runtime_client,
            modelId=MODEL_ID,
            system = [{"text": "Bạn là một trợ lý tài chính AI vui tính, nhí nhảnh và thông minh."}],
            messages = [{
                "role": "user",
                "content": [{"text": prompt}]
            }]
        )
        raw_completion = response["output"]["message"]["content"][0]["text"].strip()
        cleaned_json_str = raw_completion.strip().replace('```json', '').replace('```', '').strip()
        try:
            suggestions = json.loads(cleaned_json_str)
            return suggestions
        except json.JSONDecodeError:
            logger.error(f"Failed to decode JSON from LLM response: {cleaned_json_str}")
            return [{"jar_code": "GENERAL", "issue": "Lỗi phân tích", "recommendation": raw_completion, "priority": "low"}]

    except Exception as e:
        logger.error(f"Error generating advice for jar {triggered_jars}: {e}")
        return 
