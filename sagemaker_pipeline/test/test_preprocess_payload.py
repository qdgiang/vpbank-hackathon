# src/inference.py
import sys
import os
import pandas as pd
import numpy as np
import fasttext
import re
import tensorflow as tf
import json
import boto3
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
import joblib
import logging

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)
# ------------- CONFIG ------------------------
ID_COLS = ['transaction_id', 'user_id']
STRUCTURED_COLS = ['amount', 'txn_time', 'tranx_type', 'channel', 'location']
TEXT_COLS = ['msg_content', 'merchant', 'to_account_name']
LABEL = 'category_label'

_NORMALISE_RE = re.compile(r"[^a-z0-9\s]")
MODEL_S3_URI = "s3://test-vpb-hackathon/models/cc.vi.300.bin"

FEATURE_GROUP_NAME = "user-embeddings"
EMBED_DIM          = 64
FEATURE_NAME       = "embedding"

fs_runtime = boto3.client("sagemaker-featurestore-runtime",
                          region_name="ap-southeast-2")

# ---------- HELPER FUNCTIONS -----------------
_ARTIFACTS = {}

def _download_from_s3(s3_uri, local_path):
    """Tải file từ S3 về local_path."""
    boto_session = boto3.Session(
        profile_name=os.getenv("AWS_PROFILE"),
        region_name=os.getenv("AWS_REGION")
    )
    s3 = boto_session.client("s3")
    bucket, key = s3_uri.replace("s3://", "").split("/", 1)
    s3.download_file(bucket, key, local_path)

def _load_artifacts():
    global _ARTIFACTS
    if _ARTIFACTS:
        return _ARTIFACTS

    # Mapping S3 path → local file
    artefact_s3_paths = {
        "scaler":     "s3://test-vpb-hackathon/artefacts/amount_scaler.pkl",
        "ohe":        "s3://test-vpb-hackathon/artefacts/onehot_encoder.pkl",
        "loc_enc":    "s3://test-vpb-hackathon/artefacts/location_encoder.pkl",
        "label2id":   "s3://test-vpb-hackathon/artefacts/label2id.json"
    }

    local_dir = "/tmp/artefacts"
    os.makedirs(local_dir, exist_ok=True)

    for name, s3_path in artefact_s3_paths.items():
        local_file = os.path.join(local_dir, os.path.basename(s3_path))
        if not os.path.exists(local_file):  # chỉ tải nếu chưa có
            _download_from_s3(s3_path, local_file)

        if name == "label2id":
            with open(local_file, "r") as f:
                _ARTIFACTS[name] = json.load(f)
        else:
            _ARTIFACTS[name] = joblib.load(local_file)

    return _ARTIFACTS

def _get_model_path(s3_uri: str, local_dir: str = "/tmp/models") -> str:
    """
    Download a FastText .bin model from S3 and return the local file path.
    """
    bucket, key = s3_uri.replace("s3://", "").split("/", 1)
    os.makedirs(local_dir, exist_ok=True)
    local_path = os.path.join(local_dir, os.path.basename(key))
    boto3.client("s3").download_file(bucket, key, local_path)
    return local_path


def _normalise(text: str) -> str:
    """Lower‑case, strip accents (optional) & remove non‑alphanumerics."""
    text = text.lower()
    text = unidecode(text)
    text = self._NORMALISE_RE.sub(" ", text)
    return re.sub(r"\s+", " ", text).strip()

def embed_sentence(text) -> np.ndarray:
    """Return 1‑D np.ndarray (float32) of length `self.dim` for a sentence.

    * Normalises text (see :py:meth:`_normalise`).
    * Splits on whitespace (FastText handles OOV via sub‑words).
    * Returns zeros when no valid tokens.
    """
    if not text:
        # All zeros for empty / NaN input
        return np.zeros(dim, dtype=np.float32)

    norm = _normalise(text)
    if not norm:
        return np.zeros(dim, dtype=np.float32)

    return emb_model.get_sentence_vector(norm).astype(np.float32)

def get_struct_features(features, artefacts):
    # Handle amount
    features['amount_log'] = np.log1p(features['amount'])
    features['amount_scaled'] = artefacts['scaler'].fit_transform(features[['amount_log']])
    amount_features = ['amount_scaled']

    # Handle txn_time
    features['txn_time'] = pd.to_datetime(features['txn_time'])
    features['hour'] = features['txn_time'].dt.hour
    features['day_of_month'] = features['txn_time'].dt.day
    features['dayofweek'] = features['txn_time'].dt.dayofweek
    features['is_weekend'] = features['dayofweek'].isin([5, 6]).astype(int)
    features['hour_sin'] = np.sin(2 * np.pi * features['hour'] / 24)
    features['hour_cos'] = np.cos(2 * np.pi * features['hour'] / 24)
    features['dow_sin'] = np.sin(2 * np.pi * features['dayofweek'] / 7)
    features['dow_cos'] = np.cos(2 * np.pi * features['dayofweek'] / 7)
    time_features = ['txn_time', 'day_of_month', 'hour_sin', 'hour_cos', 'dow_sin', 'dow_cos', 'is_weekend']

    # Handle categorical features: tranx_type, channel, location
    ohe = artefacts['ohe']
    oh_cols = ['tranx_type', 'channel']
    X_cat = ohe.fit_transform(features[oh_cols])
    ohe_feature_names = ohe.get_feature_names_out(oh_cols)
    df_cat_encoded = pd.DataFrame(X_cat, columns=ohe_feature_names, index=df.index)
    features = pd.concat([features, df_cat_encoded], axis=1)
    oh_features = list(ohe_feature_names)

    le = artefacts['loc_enc']
    features['location_idx'] = le.fit_transform(features['location'])
    lb_features = ['location_idx']

    # Get final features dataframe
    selected_features = amount_features + time_features + oh_features + lb_features
    features = features[ID_COLS + FILTERED_COLS + selected_features].copy()
    return features

def get_text_embeddings(df):
    model_path = get_model_path(MODEL_S3_URI)
    global emb_model, dim
    emb_model = fasttext.load_model(str(model_path))
    dim = moel.get_dimension()

    concat_series = (
        df[TEXT_COLS]  # 1️⃣ Lấy đúng các cột chứa văn bản
        .fillna("")  # 2️⃣ Thay NaN bằng chuỗi rỗng để tránh lỗi khi ghép
        .agg(" ".join, axis=1)  # 3️⃣ Ghép giá trị trên *một hàng* thành 1 chuỗi, ngăn cách bằng dấu cách
        .astype(str)  # 4️⃣ Đảm bảo kiểu dữ liệu là string (đề phòng cột số)
    )
    embeddings = concat_series.apply(embed_sentence)
    matrix = np.vstack(embeddings.values)
    emb_df = pd.DataFrame(matrix)

    emb_df['transaction_id'] = df['transaction_id']
    emb_df['user_id'] = df['user_id']
    emb_df['tranx_type'] = df['tranx_type']
    emb_df['category_label'] = df['category_label']
    logger.info(f' ✔ Feature engineering: text embedding features - {emb_df.shape}')
    return emb_df


def uid_to_vec(user_id: str,
               _cache: dict = {}) -> np.ndarray:
    """
    Trả về vector nhúng (np.float32, shape=(EMBED_DIM,))
    Nếu không tìm thấy → vector 0.
    Cache lại để lần sau không cần gọi lại FS.
    """
    if user_id in _cache:
        return _cache[user_id]

    try:
        resp = fs_runtime.get_record(
            FeatureGroupName=FEATURE_GROUP_NAME,
            RecordIdentifierValueAsString=str(user_id),
            FeatureNames=[FEATURE_NAME]
        )
        if resp["Record"]:
            raw = resp["Record"][0]["ValueAsString"].strip("[]")
            vec = np.fromstring(raw, sep=",", dtype=np.float32)
            if vec.size != EMBED_DIM:
                logger.warning(f"Bad length ({vec.size}) for user {user_id}")
                vec = np.zeros(EMBED_DIM, dtype=np.float32)
        else:
            vec = np.zeros(EMBED_DIM, dtype=np.float32)
    except fs_runtime.exceptions.ResourceNotFoundException:
        vec = np.zeros(EMBED_DIM, dtype=np.float32)

    _cache[user_id] = vec
    return vec


def input_fn(request_body):
    data = json.loads(request_body)

    # Cho phép client gửi 1 dict hoặc list[dict]
    if isinstance(data, dict):
        records = [data]
    elif isinstance(data, list):
        records = data
    else:
        raise ValueError("Payload must be a JSON object or list of objects")

    # Data preprocess
    features = pd.DataFrame(records)
    features["amount"] = pd.to_numeric(features["amount"], errors="coerce")
    features["txn_time"] = pd.to_datetime(features["txn_time"], errors="coerce", utc=True)
    logger.info(features.dtypes)
    artefacts = _load_artifacts()

    # Get structured and text features
    struct_features = get_struct_features(features, artefacts)
    text_features = get_text_embeddings(features)

    cols_to_drop = ['tranx_type', 'txn_time', 'tranx_type_bill_payment', 'tranx_type_cashback',
                    'tranx_type_loan_repayment', 'tranx_type_mobile_topup', 'tranx_type_opensaving',
                    'tranx_type_stock', 'tranx_type_transfer_in']
    df = struct_features.drop(cols_to_drop,axis=1)
    text_features = text_features.drop(['user_id', 'tranx_type', 'category_label'], axis=1)
    df = df.merge(text_features, how='inner', on='transaction_id')

    # Get embeddings
    user_embeddings = np.vstack(
        df["user_id"].map(uid_to_vec).to_list()
    )
    X_raw = df.drop(columns=["transaction_id", "category_label", "user_id"]).values
    X = np.hstack([X_raw, user_embeddings])
    return X

if __name__ == '__main__':
    payload = {
        "user_id": "000b1dd0-c880-45fd-8515-48dd705a3aa2",
        "amount": 250000,
        "txn_time": "2025-07-10T08:30:00Z",
        "msg_content": "Thanh toán Grab",
        "merchant": "Grab",
        "location": "Hà Nội",
        "channel": "MOBILE",
        "tranx_type": "qrcode_payment",
        "category_label": ""
    }
    payload_str = json.dumps(payload)
    print(input_fn(payload_str))