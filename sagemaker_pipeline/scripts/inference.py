# src/inference.py
print(">>> Inference: Start importing")
import sys
import os
import pandas as pd
import numpy as np
import re
import json
import boto3
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
import joblib
import logging

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)
# ------------- CONFIG ------------------------
SELECTED_FEATURES = ["amount_scaled", "day_of_month", "is_weekend", "hour_sin", "hour_cos",
                     "dow_sin", "dow_cos", "tranx_type_atm_withdrawal", "tranx_type_qrcode_payment",
                     "tranx_type_transfer_out", "channel_MOBILE", "channel_WEB"]

FEATURE_GROUP_NAME = "user-embeddings"
EMBED_DIM          = 384
USER_EMBED_DIM     = 64
FEATURE_NAME       = "embedding"

fs_runtime = boto3.client(
    "sagemaker-featurestore-runtime",
    region_name='ap-southeast-2'
)

# ---------- HELPER FUNCTIONS -----------------
_ARTIFACTS = {}

def _load_artifacts():
    global _ARTIFACTS
    if _ARTIFACTS:
        return _ARTIFACTS

    base_dir = os.path.join(os.path.dirname(__file__), "artefacts")

    _ARTIFACTS["scaler"] = joblib.load(os.path.join(base_dir, "amount_scaler.pkl"))
    _ARTIFACTS["ohe"] = joblib.load(os.path.join(base_dir, "onehot_encoder.pkl"))
    _ARTIFACTS["loc_enc"] = joblib.load(os.path.join(base_dir, "location_encoder.pkl"))

    with open(os.path.join(base_dir, "label2id.json"), "r") as f:
        _ARTIFACTS["label2id"] = json.load(f)

    return _ARTIFACTS


def _get_struct_features(features):
    # Handle amount
    artefacts = _load_artifacts()
    features['amount_log'] = np.log1p(features['amount'])
    features['amount_scaled'] = artefacts['scaler'].transform(features[['amount_log']])

    # Handle txn_time
    features['txn_time'] = pd.to_datetime(features['txn_time'])
    features['hour'] = features['txn_time'].dt.hour
    features['day_of_month'] = features['txn_time'].dt.day
    features['day_of_month'] = features['day_of_month'] / 31
    features['dayofweek'] = features['txn_time'].dt.dayofweek
    features['is_weekend'] = features['dayofweek'].isin([5, 6]).astype(int)
    features['hour_sin'] = np.sin(2 * np.pi * features['hour'] / 24)
    features['hour_cos'] = np.cos(2 * np.pi * features['hour'] / 24)
    features['dow_sin'] = np.sin(2 * np.pi * features['dayofweek'] / 7)
    features['dow_cos'] = np.cos(2 * np.pi * features['dayofweek'] / 7)

    # Handle categorical features: tranx_type, channel, location
    ohe = artefacts['ohe']
    oh_cols = ['tranx_type', 'channel']
    X_cat = ohe.transform(features[oh_cols])
    ohe_feature_names = ohe.get_feature_names_out(oh_cols)
    df_cat_encoded = pd.DataFrame(X_cat, columns=ohe_feature_names, index=features.index)
    features = pd.concat([features, df_cat_encoded], axis=1)

    le = artefacts['loc_enc']
    features['location_idx'] = le.transform(features['location'])
    return features


# -------- INFERENCE FUNCTIONS ----------------
def input_handler(data, context):
    """
    :param data:
       {
            "transaction_id": transaction_id
            "user_id": user_id,
            "amount": amount,
            "txn_time": txn_time,
            "msg_content": msg_content,
            "merchant": merchant,
            "to_account_name": to_account_name,
            "location": location,
            "channel": channel,
            "tranx_type": tranx_type,
            "sentence_embedding": sentence_embedding
        }
    """
    logger.info(">>> Inside input_fn")
    try:
        if context.request_content_type != "application/json":
            raise ValueError(f"Unsupported content type {request_content_type}")

        data = data.read().decode('utf-8')
        data_dict = json.loads(data)
        required_keys = ["amount", "txn_time", "location", "channel", "tranx_type"]
        for key in required_keys:
            if key not in data_dict:
                raise ValueError(f"Missing required input: {key}")

        # Handle sentence embedding
        text_emb_raw = data_dict.pop("sentence_embedding")
        if isinstance(text_emb_raw, str):
            text_vec = np.fromstring(text_emb_raw, sep=",")
        else:
            text_vec = np.array(text_emb_raw)
        assert len(text_vec) == EMBED_DIM, f"Current len text emb - {len(text_vec)}. Embedding must have {EMBED_DIM} dimensions"

        # Handle user embedding
        user_emb_raw = data_dict.pop("user_embedding")
        if isinstance(user_emb_raw, str):
            user_vec = np.fromstring(user_emb_raw, sep=",")
        else:
            user_vec = np.array(user_emb_raw)
        assert len(user_vec) == USER_EMBED_DIM, f"Current len text emb - {len(user_vec)}. Embedding must have {USER_EMBED_DIM} dimensions"

        # Concat dataframes
        df_structured = pd.DataFrame([data_dict])
        df_structured = _get_struct_features(df_structured)
        text_emb_df = pd.DataFrame(
            [text_vec],
            columns=[f"text_emb_{i}" for i in range(EMBED_DIM)]
        )

        user_emb_df = pd.DataFrame(
            [user_vec],
            columns=[f"user_emb_{i}" for i in range(USER_EMBED_DIM)]
        )
        df_full = pd.concat([df_structured, text_emb_df, user_emb_df], axis=1)
        selected_cols = SELECTED_FEATURES
        for col in df_full.columns:
            if col.startswith('user_emb') or col.startswith('text_emb'): selected_cols.append(col)
        df_full = df_full[selected_cols]


        # Convert to numpy to feed model
        X = df_full.values
        X = X.astype(np.float32)

        logger.info(f"Final X shape: {X.shape} - {X.dtype}")
        return json.dumps({"instances": X.tolist()})
    except Exception as e:
        logger.error(f"Lỗi trong input_handler: {e}")
        raise


def output_handler(data, context):
    """Post-process TensorFlow Serving output before it is returned to the client.
    Args:
        data (obj): the TensorFlow serving response
        context (Context): an object containing request and configuration details
    Returns:
        (bytes, string): data to return to client, response content type
    """
    if data.status_code != 200:
        raise ValueError(data.content.decode('utf-8'))

    response_content_type = context.accept_header
    prediction = data.content
    return prediction, response_content_type
