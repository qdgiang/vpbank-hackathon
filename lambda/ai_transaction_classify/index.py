import json
from typing import Dict, List, Optional
import boto3
from unidecode import unidecode
import fasttext

# --------------- CONFIGS -------------
_SPECIAL_TYPES = {"qrcode_payment", "transfer_out", "atm_withdrawal"}

_KEYWORDS: Dict[str, List[str]] = {
    "NEC":  ["grab", "cho", "sieu thi", "taxi", "an uong", "an nuong", "di cho"],
    "PLAY": ["netflix", "spotify", "game", "cinema", "rap phim", "tiktok", "cgv", "galaxy"],
    "GIVE": ["tu thien", "thien nguyen", "ung ho", "donate", "charity", "quy"],
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

TRANX_TYPE_TO_LABEL = {
    "service_fee": "NEC",          # Phí dịch vụ ngân hàng, SMS,...
    "loan_repayment": "NEC",       # Trừ tiền tự động trả khoản vay
    "stock": "FFA",                # Mua/bán cổ phiếu
    "bill_payment": "NEC",         # Thanh toán điện, nước, mạng
    "opensaving": "GIVE",          # Mở tài khoản tiết kiệm linh hoạt (cho đi/tương lai)
    "opendeposit": "LTSS",         # Gửi tiết kiệm có kỳ hạn
    "openaccumulation": "LTSS",    # Kế hoạch tích lũy định kỳ
    "mobile_topup": "NEC"          # Nạp điện thoại
}

# --------TEXT PREPROCESSING ---------
def _normalize(text: str) -> str:
    """Bỏ None, lower‑case & bỏ dấu để tiện match."""
    return unidecode(text or "").lower()


def _detect_label(text_joined: str) -> Optional[str]:
    """Trả về label match đầu tiên (dựa theo thứ tự trong _KEYWORDS)."""
    for label, kw_list in _KEYWORDS.items():
        for kw in kw_list:
            if kw in text_joined:
                return label
    return None

# -------- FASTTEXT PROCESS ----------
S3_MODEL_URI = "s3://test-vpb-hackathon/models/cc.vi.300.bin"
LOCAL_MODEL_PATH = "/tmp/cc.vi.300.bin"

_embed_model = None  # cached model

def load_fasttext_model():
    """Load fastText model từ S3 về /tmp, và cache toàn cục."""
    global _embed_model
    if _embed_model is not None:
        return _embed_model

    if not os.path.exists(LOCAL_MODEL_PATH):
        print("⏬ Tải model từ S3...")
        s3 = boto3.client("s3")
        bucket, key = S3_MODEL_URI.replace("s3://", "").split("/", 1)
        s3.download_file(bucket, key, LOCAL_MODEL_PATH)
        print("✅ Model đã được tải về /tmp")

    _embed_model = fasttext.load_model(LOCAL_MODEL_PATH)
    return _embed_model

def embed_text(text: str):
    model = load_fasttext_model()
    return model.get_sentence_vector(text)

# -------- LAMBDA HANDLER ------------
def lambda_handler(event, context):
    """
    Parameters
    ----------
    event : dict
        Payload đầu vào.
    context : LambdaContext
        Thông tin runtime (không dùng tới ở đây).

    Returns
    -------
    dict
        {
          "label": <one of NEC|FFA|LTSS|GIVE|PLAY|EDU>,
          "response_msg": <string>
        }
    """
    try:
        # Load data
        transaction_id = event.get("transaction_id", "")
        user_id = event.get("user_id", "")
        amount = event.get("amount", 0)
        txn_time = event.get("txn_time")
        msg_content = event.get("msg_content", "").lower()
        merchant = event.get("merchant", "").lower()
        to_account_name = event.get("to_account_name", "").lower()
        location = event.get("location", "Hà Nội").lower()
        channel = event.get("channel", "MOBILE")
        tranx_type = event.get("tranx_type", "transfer_out").lower()

        # 1. tranx_type không thuộc 3 loại đặc biệt
        if tranx_type not in _SPECIAL_TYPES:
            response_msg = (
                f"Chúng tôi phân loại giao dịch dựa trên loại giao dịch: '{TRANX_TYPE_VIETNAMESE[tranx_type]}'. "
                "Nếu bạn muốn chỉnh sửa, hãy phản hồi nhé!"
            )
            return {
                "label": TRANX_TYPE_TO_LABEL[tranx_type],
                "response_msg": response_msg,
            }

        # 2. Ghép nội dung & dò keyword
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
                f"Phát hiện keyword liên quan tới nhóm {TRANX_TYPE_VIETNAMESE[label]}, "
                "bạn có muốn chỉnh sửa không?"
            )

        # 3. Không có keyword → ML Model
        if label is None:
            label = 'NEC'
            response_msg = "Default"

            # Preprocessing data for ML model ---> dev...
            vec = embed_text(text_joined)
            embedding = vec.astype(float).tolist()  # JSON serialisable
            logger.info(f'Text embedding: {embedding}')  # check embeddings

            # features = {
            #     "tranx_id": tranx_id,
            #     "user_id": user_id,
            #     "amount": amount,
            #     "txn_time": txn_time,
            #     "msg_content": msg_content,
            #     "tranx_type": tranx_type,
            #     "channel": channel,
            #     "location": location,
            #     "embedding": embedding  # ← fastText vector (list[float])
            # }
            # payload = {"instances": [features]}  # TensorFlow‑style
            # response = runtime_sm.invoke_endpoint(
            #     EndpointName=ENDPOINT_NAME,
            #     ContentType=CONTENT_TYPE,
            #     Body=json.dumps(payload, default=Decimal)  # Decimal for ints > JS limit
            # )
            # predictions = json.loads(response["Body"].read().decode())
        return {
            "transaction_id": transaction_id,
            "jar": label,
            "response_msg": response_msg,
        }

    except Exception as e:
        # Trả lỗi kèm trace ngắn cho debug (không nên để chi tiết quá production)
        return {
            "jar": "NEC",
            "response_msg": f"Lỗi phân loại: {str(e)}. Vui lòng thử lại hoặc liên hệ hỗ trợ.",
        }
