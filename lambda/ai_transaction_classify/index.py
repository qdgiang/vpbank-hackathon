import sys
import os
import glob
import boto3
from typing import Dict, List, Optional
import numpy as np
import json
import re

# --------------- CONFIG KEYWORDS -------------
_SPECIAL_TYPES = {"qrcode_payment", "transfer_out", "atm_withdrawal"}

_KEYWORDS: Dict[str, List[str]] = {
    "NEC":  ["grab", "cho", "sieu thi", "taxi", "an uong", "an nuong", "di cho"],
    "PLY": ["netflix", "spotify", "game", "cinema", "rap phim", "tiktok", "cgv", "galaxy"],
    "GIV": ["tu thien", "thien nguyen", "ung ho", "donate", "charity", "quy"],
    "EDU":  ["hoc phi", "khoa hoc", "sach", "book", "education", "course", "udemy", "coursera"],
    "LTSS": ["tiet kiem", "mua nha", "mua nha", "mua xe", "mua xe"],
    "FFA":  ["chung khoan", "chungkhoan", "crypto", "investment", "vang", "stock", "securities"],
}

TRANX_TYPE_VIETNAMESE = {
    "transfer_in": "Nhận chuyển khoản",
    "transfer_out": "Chuyển khoản",
    "qrcode_payment": "Thanh toán QR",
    "atm_withdrawal": "Rút tiền ATM",
    "service_fee": "Phí dịch vụ",
    "loan_repayment": "Trả nợ vay",
    "stock": "Đầu tư chứng khoán",
    "bill_payment": "Thanh toán hóa đơn",
    "opensaving": "Mở sổ tiết kiệm",
    "opendeposit": "Gửi tiền có kỳ hạn",
    "openaccumulation": "Mở tài khoản tích lũy",
    "mobile_topup": "Nạp tiền điện thoại",
    "cashback": "Hoàn tiền",
    "refund": "Hoàn trả"
}

LABEL_VIETNAMESE = {
    "NEC": "Nhu cầu thiết yếu",
    "GIV": "Cho đi / Tương lai",
    "LTSS": "Tiết kiệm dài hạn",
    "FFA": "Tự do tài chính",
    "EDU": "Giáo dục",
    "PLY": "Giải trí"
}

TRANX_TYPE_TO_LABEL = {
    "service_fee": "NEC",          # Phí dịch vụ ngân hàng, SMS,...
    "loan_repayment": "NEC",       # Trừ tiền tự động trả khoản vay
    "stock": "FFA",                # Mua/bán cổ phiếu
    "bill_payment": "NEC",         # Thanh toán điện, nước, mạng
    "opensaving": "GIV",          # Mở tài khoản tiết kiệm linh hoạt (cho đi/tương lai)
    "opendeposit": "LTSS",         # Gửi tiết kiệm có kỳ hạn
    "openaccumulation": "LTSS",    # Kế hoạch tích lũy định kỳ
    "mobile_topup": "NEC"          # Nạp điện thoại
}


# --- CONFIG CLIENT ---
session = boto3.Session(region_name="ap-southeast-2")
s3 = session.client("s3")
sagemaker_runtime = session.client("sagemaker-runtime")
fs_runtime = session.client("sagemaker-featurestore-runtime")

USER_EMBED_DIM = 64
# --- HELPER FUNCTIONS ---
def _embed_sentence(text: str, endpoint_name="sentence-embed-endpoint-v1") -> list[float]:
    print('-- Calling text-embedding model endpoint ')
    payload = json.dumps({"inputs": [text]})
    resp = sagemaker_runtime.invoke_endpoint(
        EndpointName=endpoint_name,
        ContentType="application/json",
        Body=payload
    )
    raw = json.loads(resp["Body"].read())[0][0]
    vec = np.mean(raw, axis=0).tolist()  # Mean-pooling over token embeddings
    print(f"[DEBUG] vec shape: {np.shape(vec)}")
    csv_vec = ",".join(f"{x:.6g}" for x in vec)
    return csv_vec

def _embed_user(user_id):
    print('-- Getting user_embed from feature-store')
    record_identifier_value = user_id
    try:
        record = fs_runtime.get_record(
            FeatureGroupName="user-embeddings",
            RecordIdentifierValueAsString=record_identifier_value,
            FeatureNames=["embedding"]
        )
    except Exception as e:
        print(f"Error when get record from feature-store {record_identifier_value}: {e}")

    if record.get('Record'):
        for item in record['Record']:
            if item['FeatureName'] == 'embedding':
                raw = item['ValueAsString']
                raw = raw.strip("[]")
                vec = np.fromstring(raw, sep=",", dtype=np.float32)
                print(f"User embedding len: {vec.size}")
                if vec.size != USER_EMBED_DIM:
                    logger.warning(f"Bad length ({vec.size}) for user {uid}")
                    vec = np.zeros(USER_EMBED_DIM, dtype=np.float32)
    else:
        logger.warning(f"No record found for user {uid}")
        vec = np.zeros(USER_EMBED_DIM, dtype=np.float32)
    print(f"[DEBUG] vec shape: {np.shape(vec)}")
    csv_vec = ",".join(f"{x:.6g}" for x in vec)
    return csv_vec

def _normalize(text: str) -> str:
    """Bỏ None, lower‑case & bỏ dấu để tiện match."""
    #return unidecode(text or "").lower()
    if text is None:
        return ""
    return text.lower()

def _detect_label(text_joined: str) -> Optional[str]:
    """Trả về label match đầu tiên (dựa theo thứ tự trong _KEYWORDS)."""
    for label, kw_list in _KEYWORDS.items():
        for kw in kw_list:
            if kw in text_joined:
                return label
    return None


def _classify_using_ML(payload, endpoint_name="transaction-classifier-serverless-endpoint-v1"):
    print('--- Calling SageMaker endpoint')
    resp = sagemaker_runtime.invoke_endpoint(
            EndpointName=endpoint_name,
            ContentType="application/json",
            Body=json.dumps(payload)
    )
    body_str = resp["Body"].read().decode()
    preds = json.loads(body_str)['predictions'][0]
    label_idx = int(np.argmax(preds))
    prob = float(np.max(preds))

    # Mapping chỉ mục → tên nhãn
    LABELS = ["NEC", "FFA", "PLAY", "EDU", "GIVE", "LTSS"]
    predicted_label = LABELS[label_idx]

    print(f'Predicted result: {predicted_label} - {prob}')
    return {
        "predicted_label": predicted_label,
        "probability": prob
    }

# --- PROCESSING FUNCTIONS ---
def response(status, body):
    return {
        'statusCode': status,
        'body': json.dumps(body, default=str),
        'headers': {'Content-Type': 'application/json'}
    }

def handler(event, context):
    try:
        # Load data
        transaction_id = event.get("transaction_id", "")
        user_id = event.get("user_id", "")
        amount = event.get("amount", 0)
        txn_time = event.get("txn_time")
        msg_content = event.get("msg_content", "").lower()
        merchant = event.get("merchant", "").lower()
        to_account_name = event.get("to_account_name", "").lower()
        location = event.get("location", "Hà Nội")
        channel = event.get("channel", "MOBILE")
        tranx_type = event.get("tranx_type", "transfer_out")

        # 1. Classify by tranx_type
        print('Checking tranx_type ...')
        if tranx_type not in _SPECIAL_TYPES:
            response_msg = (
                f"Chúng tôi phân loại giao dịch dựa trên loại giao dịch: '{TRANX_TYPE_VIETNAMESE[tranx_type]}'. \n Nếu bạn muốn chỉnh sửa, hãy phản hồi nhé!"
            )
            body = {
                "transaction_id": transaction_id,
                "jar": TRANX_TYPE_TO_LABEL[tranx_type],
                "response_msg": response_msg,
            }
            return response(200, body)

        # 2. Classify by keywords
        print('Checking key words ...')
        text_joined = " ".join(
            filter(
                None,
                [
                    _normalize(msg_content),
                    _normalize(merchant),
                    _normalize(to_account_name),
                ],
            )
        )
        label = _detect_label(text_joined)
        if label:
            response_msg = (
                f"Phát hiện keyword liên quan tới nhóm {label} ({LABEL_VIETNAMESE[label]}), \n bạn có muốn chỉnh sửa không?"
            )
            body = {
                "transaction_id": transaction_id,
                "jar": label,
                "response_msg": response_msg,
            }
            return response(200, body)

        # 3. Keyword not found -> Call ML <dev...>
        print('Call ML ...')
        joined_text = " ".join([s or "" for s in (msg_content, merchant, to_account_name)])
        joined_text = re.sub(r"\s+", " ", joined_text).strip()
        sentence_embedding = _embed_sentence(joined_text)
        user_embed = _embed_user(user_id)
        payload = {
            "transaction_id": transaction_id,
            "amount": amount,
            "txn_time": txn_time,
            "msg_content": msg_content,
            "merchant": merchant,
            "to_account_name": to_account_name,
            "location": location,
            "channel": channel,
            "tranx_type": tranx_type,
            "user_embedding": user_embed,
            "sentence_embedding": sentence_embedding
        }
        ml_resp = _classify_using_ML(payload)
        jar = ml_resp['predicted_label']

        body = {
            "transaction_id": transaction_id,
            "jar": jar,
            "response_msg": 'Hệ thống dùng AI để phân loại, bạn có muốn thay đổi?',
        }
        return response(200, body)

    except Exception as e:
        return {
            "statusCode": 500,
            "error": str(e)
        }
    return 0

